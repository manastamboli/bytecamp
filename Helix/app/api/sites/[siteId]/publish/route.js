import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { convertPageToHtml } from "@/lib/publish/jsonToHtml";
import {
    uploadDeploymentToS3,
    updateKVS,
    buildDeploymentPrefix,
    buildSiteUrl,
} from "@/lib/aws/s3-publish";
import { getPlanGuard, PlanGuardError, planGuardErrorResponse } from "@/lib/plan-guard";

export const runtime = "nodejs";

/**
 * POST /api/sites/[siteId]/publish
 *
 * Publishes the entire site to S3 with a new versioned deploymentId.
 * Flow (atomic by design):
 *   1. Auth + access check
 *   2. Fetch all published pages for the site
 *   3. Generate HTML for each page
 *   4. Create a ContentVersion snapshot in DB
 *   5. Upload to S3: sites/{userId}/{businessId}/{siteId}/deployments/{deploymentId}/
 *   6. Only after ALL uploads succeed → update CloudFront KVS
 *   7. Record deployment in DB, mark all others as inactive
 *
 * Body (JSON):
 *   { deploymentName?: string }  — optional friendly label for this deployment
 */
export async function POST(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { siteId } = await params;

        // ── 1. Load site + verify membership ─────────────────────────────────────
        const site = await prisma.site.findUnique({
            where: { id: siteId },
            include: {
                pages: {
                    where: { isPublished: true },
                },
                customDomains: {
                    where: { attachedToCF: true },
                },
                tenant: { select: { id: true, ownerId: true } },
            },
        });

        if (!site) {
            return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }

        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId: site.tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ── PLAN GUARD: Check subscription status & deployment limit ──────────
        try {
            const guard = await getPlanGuard(prisma, site.tenantId);
            guard.requireActive();

            // Count deployments in current billing period
            const periodStart = (await prisma.subscription.findUnique({
                where: { tenantId: site.tenantId },
                select: { currentPeriodStart: true },
            }))?.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);

            const deploymentsThisCycle = await prisma.deployment.count({
                where: { siteId, createdAt: { gte: periodStart } },
            });

            guard.checkDeploymentLimit(deploymentsThisCycle);
        } catch (err) {
            if (err instanceof PlanGuardError) {
                return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
            }
            throw err;
        }

        // ── 2. Parse body ─────────────────────────────────────────────────────────
        let deploymentName = null;
        try {
            const body = await request.json();
            deploymentName = body?.deploymentName?.trim() || null;
        } catch {
            // body is optional
        }

        // ── 3. Validate pages ─────────────────────────────────────────────────────
        if (!site.pages || site.pages.length === 0) {
            return NextResponse.json(
                { error: "Site has no published pages to deploy" },
                { status: 400 }
            );
        }

        // ── 4. Generate deploymentId & Compile HTML for DO NOT OVERWRITE ──────────
        const deploymentId = randomUUID();
        const userId = site.tenant.ownerId;
        const businessId = site.tenantId;

        const files = [];
        const snapshotPages = [];

        for (const page of site.pages) {
            // Compile snapshot data
            snapshotPages.push({
                slug: page.slug,
                name: page.name,
                layout: page.layout,
                seo: page.seo,
            });

            // Determine output paths
            const isHomePage = page.slug === "/";
            const baseFilename = isHomePage
                ? "index"
                : page.slug.replace(/^\//, "").replace(/\//g, "-");

            const cssFilename = `${baseFilename}.css`;
            const jsFilename = `${baseFilename}.js`;

            // Compile the page
            const { html, css, js } = await convertPageToHtml(
                site.theme,
                page,
                site.name,
                { stylesHref: cssFilename, scriptSrc: jsFilename, siteSlug: site.slug }
            );

            // If the user wants `about/index.html` structure instead of `about.html`:
            // The prompt says "about/index.html" structure. Note: CloudFront standard KVS points to prefix, 
            // so requesting /about would normally need CloudFront to append /index.html 
            // but let's use the requested structure or standard index.html nesting.
            const htmlPath = isHomePage ? "index.html" : `${page.slug.replace(/^\//, "")}/index.html`;
            const cssPath = `${baseFilename}.css`;
            const jsPath = `${baseFilename}.js`;

            files.push({ path: htmlPath, content: html, contentType: "text/html; charset=utf-8" });
            files.push({ path: cssPath, content: css, contentType: "text/css; charset=utf-8" });
            files.push({ path: jsPath, content: js, contentType: "application/javascript; charset=utf-8" });
        }

        // ── 5. Create ContentVersion Snapshot ─────────────────────────────────────
        // Determine the next version number
        const lastVersion = await prisma.contentVersion.findFirst({
            where: { siteId },
            orderBy: { versionNumber: 'desc' }
        });
        const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

        const contentVersion = await prisma.contentVersion.create({
            data: {
                siteId,
                versionNumber: nextVersionNumber,
                pages: snapshotPages,
                theme: site.theme,
                globalSettings: site.globalSettings,
            }
        });

        // ── 6. Upload ALL pages to S3 ─────────────────────────────────────────────
        const { s3Prefix } = await uploadDeploymentToS3({
            userId,
            businessId,
            siteId,
            deploymentId,
            files,
        });

        // ── 7. Update CloudFront KVS ──────────────────────────────────────────────
        const keysToUpdate = [site.slug];
        if (site.customDomains?.length > 0) {
            site.customDomains.forEach(cd => keysToUpdate.push(cd.domain));
        }

        let kvsUpdated = false;
        try {
            for (const key of keysToUpdate) {
                await updateKVS(key, s3Prefix);
            }
            kvsUpdated = true;
        } catch (kvsError) {
            console.error("KVS update failed (non-fatal):", kvsError.message);
        }

        // ── 8. Persist deployment to DB (transaction) ─────────────────────────────
        const deployment = await prisma.$transaction(async (tx) => {
            // Deactivate all previous deployments for this site
            await tx.deployment.updateMany({
                where: { siteId, isActive: true },
                data: { isActive: false },
            });

            // Create new active deployment record
            const dep = await tx.deployment.create({
                data: {
                    deploymentId,
                    deploymentName,
                    s3Key: s3Prefix,
                    isActive: true,
                    kvsUpdated,
                    siteId,
                    contentVersionId: contentVersion.id,
                },
            });

            return dep;
        });

        const siteUrl = buildSiteUrl(site.slug); // Note: Should probably use the actual Domain

        return NextResponse.json({
            success: true,
            deploymentId,
            deploymentName,
            s3Prefix,
            kvsUpdated,
            siteUrl,
            liveUrl: siteUrl,
            message: kvsUpdated
                ? `Site published! Live at ${siteUrl}`
                : `Site uploaded to S3 (KVS update failed — traffic not yet routed).`,
        });
    } catch (error) {
        console.error("Publish error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to publish site" },
            { status: 500 }
        );
    }
}
