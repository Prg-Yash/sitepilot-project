import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { amount, currency = "INR", items, siteId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid checkout amount" }, { status: 400 });
    }

    let targetKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    let targetKeySecret = process.env.RAZORPAY_KEY_SECRET;
    let merchantName = "SitePilot Store";

    // ── Check if site has its own verified Razorpay account ────────────
    if (siteId) {
      try {
        const site = await prisma.site.findUnique({
          where: { id: siteId },
          select: { name: true, globalSettings: true },
        });

        const gateway = site?.globalSettings?.paymentGateway;
        if (gateway?.verified && gateway?.keyId && gateway?.keySecret) {
          targetKeyId = gateway.keyId;
          targetKeySecret = gateway.keySecret;
          merchantName = gateway.merchantName || site.name || merchantName;
        }
      } catch (dbErr) {
        console.warn("Could not load site-specific gateway:", dbErr.message);
      }
    }

    // ── Initialize Razorpay with selected credentials ───────────────────
    if (targetKeyId && targetKeySecret) {
      try {
        const razorpay = new Razorpay({
          key_id: targetKeyId,
          key_secret: targetKeySecret,
        });

        const options = {
          amount: Math.round(amount * 100), // in paise
          currency,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            itemsCount: items?.length || 0,
            merchant: merchantName,
          },
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: targetKeyId,
          merchantName,
        });
      } catch (rzpErr) {
        console.error("Razorpay order creation error:", rzpErr);
        // Fall back to demo response if live keys rejected by Razorpay
      }
    }

    // Demo fallback for sandbox / development mode
    return NextResponse.json({
      success: true,
      orderId: `order_demo_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      keyId: targetKeyId || "rzp_test_sitepilot_demo",
      merchantName,
      demo: true,
    });
  } catch (error) {
    console.error("Razorpay checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process checkout" },
      { status: 500 }
    );
  }
}
