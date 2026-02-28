import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { pageViewId } = body;

        if (!pageViewId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400, headers: CORS_HEADERS });
        }

        const pageView = await prisma.pageView.findUnique({
            where: { id: pageViewId },
            select: { id: true, enteredAt: true, exitedAt: true },
        });

        if (!pageView) {
            return NextResponse.json({ error: "PageView not found" }, { status: 404, headers: CORS_HEADERS });
        }

        // Guard against duplicate exit calls
        if (pageView.exitedAt) {
            return NextResponse.json({ success: true, duration: 0, duplicate: true }, { headers: CORS_HEADERS });
        }

        const exitedAt = new Date();
        const durationMs = exitedAt.getTime() - pageView.enteredAt.getTime();
        // Cap duration at 30 minutes to avoid stale-tab inflation
        const duration = Math.min(Math.max(Math.floor(durationMs / 1000), 0), 1800);

        await prisma.pageView.update({
            where: { id: pageViewId },
            data: { exitedAt, duration },
        });

        return NextResponse.json({ success: true, duration }, { headers: CORS_HEADERS });
    } catch (error) {
        console.error("Analytics exit error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500, headers: CORS_HEADERS });
    }
}
