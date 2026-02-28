import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPlanGuard, PlanGuardError, planGuardErrorResponse } from "@/lib/plan-guard";

export async function GET(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { siteId } = await params;

        const site = await prisma.site.findUnique({
            where: { id: siteId },
            select: { id: true, tenantId: true },
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

        // ── PLAN GUARD: active subscription check ─────────────────────────
        try {
            const guard = await getPlanGuard(prisma, site.tenantId);
            guard.requireActive();
        } catch (err) {
            if (err instanceof PlanGuardError) {
                return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
            }
            throw err;
        }

        let siteStats = { totalViews: 0, uniqueSessions: 0, avgDuration: 0 };
        let pageStats = [];

        try {
            // Use database-level aggregation for scalability
            const [totalViews, uniqueSessions, durationAgg, pageGrouped] = await Promise.all([
                // Total page views
                prisma.pageView.count({ where: { siteId } }),
                // Unique sessions
                prisma.visitorSession.count({ where: { siteId } }),
                // Average duration (only views that have exited)
                prisma.pageView.aggregate({
                    where: { siteId, duration: { gt: 0 } },
                    _avg: { duration: true },
                }),
                // Per-page grouped stats
                prisma.pageView.groupBy({
                    by: ['pageSlug'],
                    where: { siteId },
                    _count: { id: true },
                    _avg: { duration: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 50,
                }),
            ]);

            siteStats = {
                totalViews,
                uniqueSessions,
                avgDuration: Math.round(durationAgg._avg?.duration || 0),
            };

            // For unique sessions per page, do a single efficient query
            const pageSessionCounts = pageGrouped.length > 0
                ? await prisma.pageView.groupBy({
                    by: ['pageSlug', 'sessionId'],
                    where: { siteId },
                })
                : [];

            // Build a slug → unique session count map
            const slugSessionMap = {};
            for (const row of pageSessionCounts) {
                slugSessionMap[row.pageSlug] = (slugSessionMap[row.pageSlug] || 0) + 1;
            }

            pageStats = pageGrouped.map(pg => ({
                slug: pg.pageSlug,
                views: pg._count.id,
                uniqueSessions: slugSessionMap[pg.pageSlug] || 0,
                avgDuration: Math.round(pg._avg?.duration || 0),
            }));
        } catch (analyticsError) {
            console.warn("[Analytics] Models not ready — returning empty stats.", analyticsError.message);
        }

        return NextResponse.json({
            success: true,
            siteStats,
            pageStats,
        });
    } catch (error) {
        console.error("Analytics fetch error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
