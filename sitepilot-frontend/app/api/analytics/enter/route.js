import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// IP hashing salt — falls back to a static value when env var is absent
const IP_SALT = process.env.ANALYTICS_SALT || process.env.BETTER_AUTH_SECRET || "sp-analytics-salt";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch {
            const raw = await request.text();
            body = raw ? JSON.parse(raw) : {};
        }

        const { siteId, pageSlug, userAgent, referrer } = body || {};
        let { sessionId } = body || {};

        if (!siteId || !pageSlug) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400, headers: CORS_HEADERS });
        }

        // Verify the site exists before recording analytics
        const siteExists = await prisma.site.findUnique({
            where: { id: siteId },
            select: { id: true },
        });
        if (!siteExists) {
            return NextResponse.json({ error: "Invalid site" }, { status: 404, headers: CORS_HEADERS });
        }

        // IP Hashing (pseudonymization — never store raw IPs)
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        const ipHash = crypto.createHash('sha256').update(ip + IP_SALT).digest('hex');

        // Resolve or create session (scoped to this specific site)
        let visitorSession = null;
        if (sessionId) {
            visitorSession = await prisma.visitorSession.findFirst({
                where: { id: sessionId, siteId },
            });
        }

        if (!visitorSession) {
            visitorSession = await prisma.visitorSession.create({
                data: {
                    siteId,
                    ipHash,
                    userAgent: userAgent ? String(userAgent).slice(0, 512) : "Unknown",
                },
            });
            sessionId = visitorSession.id;
        } else {
            // Touch updatedAt to keep the session alive
            await prisma.visitorSession.update({
                where: { id: visitorSession.id },
                data: { updatedAt: new Date() },
            });
        }

        // Record page view
        const pageView = await prisma.pageView.create({
            data: {
                sessionId: visitorSession.id,
                siteId,
                pageSlug: String(pageSlug).slice(0, 512),
                enteredAt: new Date(),
            },
        });

        return NextResponse.json(
            { success: true, pageViewId: pageView.id, sessionId },
            { headers: CORS_HEADERS }
        );
    } catch (error) {
        console.error("Analytics enter error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500, headers: CORS_HEADERS });
    }
}
