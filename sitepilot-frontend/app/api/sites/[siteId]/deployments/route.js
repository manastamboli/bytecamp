import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

/**
 * GET /api/sites/[siteId]/deployments
 *
 * Returns all deployments for a site ordered by newest first.
 * Each deployment includes its friendly name, active status, S3 key, and timestamps.
 */
export async function GET(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { siteId } = await params;

        // Verify site exists and user has access
        const site = await prisma.site.findUnique({ where: { id: siteId } });
        if (!site) {
            return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }

        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId: site.tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const deployments = await prisma.deployment.findMany({
            where: { siteId },
            orderBy: { createdAt: "desc" },
            include: { contentVersion: true },
        });

        const formattedDeployments = deployments.map(dep => ({
            id: dep.id,
            deploymentId: dep.deploymentId,
            deploymentName: dep.deploymentName,
            createdAt: dep.createdAt,
            isLive: dep.isActive,
            contentVersionId: dep.contentVersionId,
            versionNumber: dep.contentVersion?.versionNumber,
        }));

        return NextResponse.json({ deployments: formattedDeployments, total: deployments.length });
    } catch (error) {
        console.error("GET /api/sites/[siteId]/deployments error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to fetch deployments" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/sites/[siteId]/deployments/[deploymentId]
 *
 * Rename a specific deployment.
 * Body: { deploymentId: string, deploymentName: string }
 */
export async function PATCH(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { siteId } = await params;
        const { deploymentId, deploymentName } = await request.json();

        if (!deploymentId || !deploymentName?.trim()) {
            return NextResponse.json(
                { error: "deploymentId and deploymentName are required" },
                { status: 400 }
            );
        }

        const site = await prisma.site.findUnique({ where: { id: siteId } });
        if (!site) {
            return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }

        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId: site.tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const deployment = await prisma.deployment.findFirst({
            where: { deploymentId, siteId },
        });
        if (!deployment) {
            return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
        }

        const updated = await prisma.deployment.update({
            where: { id: deployment.id },
            data: { deploymentName: deploymentName.trim() },
        });

        return NextResponse.json({ deployment: updated });
    } catch (error) {
        console.error("PATCH /api/sites/[siteId]/deployments error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to rename deployment" },
            { status: 500 }
        );
    }
}
