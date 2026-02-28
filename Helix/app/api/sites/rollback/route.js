import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateKVS, verifyDeploymentExists, buildSiteUrl } from "@/lib/aws/s3-publish";

export const runtime = "nodejs";

/**
 * POST /api/sites/rollback
 *
 * Instantly rolls back a site to any previous deployment by updating
 * the CloudFront KVS to point to the chosen deploymentId.
 * The S3 files are never deleted, so rollback is instant and safe.
 *
 * Body (JSON):
 *   { siteSlug: string, deploymentId: string }
 *
 * Flow:
 *   1. Validate inputs + auth
 *   2. Look up the deployment record in DB to get its s3Key
 *   3. Verify the S3 files still exist (safety check)
 *   4. Update CloudFront KVS to point to target deployment
 *   5. Update DB: mark target as active, deactivate others
 */
export async function POST(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { siteSlug, deploymentId } = body;

        if (!siteSlug || !deploymentId) {
            return NextResponse.json(
                { error: "siteSlug and deploymentId are required" },
                { status: 400 }
            );
        }

        // ── 1. Find the site by slug ───────────────────────────────────────────────
        const site = await prisma.site.findFirst({
            where: { slug: siteSlug },
            include: { customDomains: { where: { attachedToCF: true } } },
        });

        if (!site) {
            return NextResponse.json(
                { error: `Site with slug "${siteSlug}" not found` },
                { status: 404 }
            );
        }

        // ── 2. Verify tenant membership ───────────────────────────────────────────
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId: site.tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ── 3. Look up the target deployment record ────────────────────────────────
        const deployment = await prisma.deployment.findFirst({
            where: { deploymentId, siteId: site.id },
        });

        if (!deployment) {
            return NextResponse.json(
                { error: `Deployment "${deploymentId}" not found for this site` },
                { status: 404 }
            );
        }

        // ── 4. Verify S3 files still exist ────────────────────────────────────────
        const exists = await verifyDeploymentExists(deployment.s3Key);
        if (!exists) {
            return NextResponse.json(
                {
                    error: `Deployment files no longer exist in S3 for deployment "${deploymentId}". Cannot rollback.`,
                },
                { status: 422 }
            );
        }

        // ─NEW─ Find the previously active deployment
        const previouslyActive = await prisma.deployment.findFirst({
            where: { siteId: site.id, isActive: true },
        });

        // ── 5. Update CloudFront KVS ──────────────────────────────────────────────
        const keysToUpdate = [site.slug];
        if (site.customDomains?.length > 0) {
            site.customDomains.forEach(cd => keysToUpdate.push(cd.domain));
        }

        let kvsUpdated = false;
        try {
            for (const key of keysToUpdate) {
                await updateKVS(key, deployment.s3Key);
            }
            kvsUpdated = true;
        } catch (kvsError) {
            console.error("KVS rollback update failed:", kvsError.message);
            return NextResponse.json(
                { error: `KVS update failed: ${kvsError.message}` },
                { status: 500 }
            );
        }

        // ── 6. Update DB atomically & cleanup previous ────────────────────────────
        await prisma.$transaction(async (tx) => {
            // Deactivate all deployments for the site
            await tx.deployment.updateMany({
                where: { siteId: site.id, isActive: true },
                data: { isActive: false },
            });

            // Activate the rolled-back deployment
            await tx.deployment.update({
                where: { id: deployment.id },
                data: { isActive: true, kvsUpdated: true },
            });

            // If we are rolling back from A to B, delete A in DB
            if (previouslyActive && previouslyActive.id !== deployment.id) {
                await tx.deployment.delete({ where: { id: previouslyActive.id } });
            }
        });

        // Delete from S3 in background/async safely AFTER database commits
        if (previouslyActive && previouslyActive.id !== deployment.id) {
            import('@/lib/aws/s3-publish').then(({ deleteDeploymentFromS3 }) => {
                deleteDeploymentFromS3(previouslyActive.s3Key).catch(err => {
                    console.error("Failed to cleanup old S3 deployment after rollback:", err);
                });
            });
        }

        const siteUrl = buildSiteUrl(siteSlug);

        return NextResponse.json({
            success: true,
            rolledBackTo: deploymentId,
            deploymentName: deployment.deploymentName,
            s3Key: deployment.s3Key,
            kvsUpdated,
            siteUrl,
            message: `Rolled back to deployment "${deployment.deploymentName || deploymentId}". Live at ${siteUrl}`,
        });
    } catch (error) {
        console.error("Rollback error:", error);
        return NextResponse.json(
            { error: error?.message || "Rollback failed" },
            { status: 500 }
        );
    }
}
