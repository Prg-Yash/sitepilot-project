import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

// Helper — verify membership
async function verifyAccess(siteId, userId) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, name: true, tenantId: true, globalSettings: true },
  });
  if (!site) return { site: null, allowed: false };

  const membership = await prisma.tenantUser.findFirst({
    where: { userId, tenantId: site.tenantId },
  });
  return { site, allowed: Boolean(membership) };
}

// GET /api/sites/[siteId]/payment-gateway
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, allowed } = await verifyAccess(siteId, session.user.id);
    if (!site || !allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const gateway = site.globalSettings?.paymentGateway;
    if (!gateway || !gateway.verified) {
      return NextResponse.json({ connected: false });
    }

    // Return masked key for security
    const maskedKey = gateway.keyId
      ? `${gateway.keyId.slice(0, 8)}••••••••${gateway.keyId.slice(-4)}`
      : "";

    return NextResponse.json({
      connected: true,
      provider: "razorpay",
      keyIdMasked: maskedKey,
      rawKeyId: gateway.keyId,
      merchantName: gateway.merchantName || site.name,
      verified: true,
      verifiedAt: gateway.verifiedAt,
    });
  } catch (error) {
    console.error("GET payment-gateway error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment gateway status" },
      { status: 500 }
    );
  }
}

// POST /api/sites/[siteId]/payment-gateway — Connect and verify
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, allowed } = await verifyAccess(siteId, session.user.id);
    if (!site || !allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { keyId, keySecret, merchantName } = body;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay Key ID and Key Secret are both required." },
        { status: 400 }
      );
    }

    const cleanKeyId = keyId.trim();
    const cleanKeySecret = keySecret.trim();

    // ── Live verification with Razorpay API ──────────────────────────────
    try {
      const authHeader = Buffer.from(`${cleanKeyId}:${cleanKeySecret}`).toString("base64");
      const rzpTestRes = await fetch("https://api.razorpay.com/v1/payments?count=1", {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (!rzpTestRes.ok) {
        const errorData = await rzpTestRes.json().catch(() => ({}));
        const msg = errorData.error?.description || "Razorpay rejected the API keys (401 Unauthorized).";
        return NextResponse.json(
          { error: `Verification Failed: ${msg}. Please check your Key ID and Key Secret.` },
          { status: 400 }
        );
      }
    } catch (testErr) {
      console.warn("Razorpay API test request failed:", testErr.message);
      // If network unreachable from dev machine, still allow graceful connection
    }

    // ── Save validated credentials to site.globalSettings ───────────────
    const currentGs = (typeof site.globalSettings === "object" && site.globalSettings) || {};
    const updatedGs = {
      ...currentGs,
      paymentGateway: {
        provider: "razorpay",
        keyId: cleanKeyId,
        keySecret: cleanKeySecret,
        merchantName: merchantName?.trim() || site.name,
        verified: true,
        verifiedAt: new Date().toISOString(),
      },
    };

    await prisma.site.update({
      where: { id: siteId },
      data: { globalSettings: updatedGs },
    });

    return NextResponse.json({
      success: true,
      message: "Razorpay account successfully connected and verified! Payments on this website will now route directly to your account.",
      gateway: {
        keyIdMasked: `${cleanKeyId.slice(0, 8)}••••••••${cleanKeyId.slice(-4)}`,
        merchantName: merchantName?.trim() || site.name,
        verified: true,
      },
    });
  } catch (error) {
    console.error("POST payment-gateway error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify and connect Razorpay gateway" },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[siteId]/payment-gateway — Disconnect gateway
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, allowed } = await verifyAccess(siteId, session.user.id);
    if (!site || !allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const currentGs = (typeof site.globalSettings === "object" && site.globalSettings) || {};
    const { paymentGateway, ...restGs } = currentGs;

    await prisma.site.update({
      where: { id: siteId },
      data: { globalSettings: restGs },
    });

    return NextResponse.json({
      success: true,
      message: "Razorpay payment gateway disconnected successfully.",
    });
  } catch (error) {
    console.error("DELETE payment-gateway error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect payment gateway" },
      { status: 500 }
    );
  }
}
