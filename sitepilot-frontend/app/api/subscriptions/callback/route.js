/**
 * app/api/subscriptions/callback/route.js
 *
 * GET /api/subscriptions/callback?razorpay_subscription_id=...&razorpay_payment_id=...
 *
 * Razorpay redirects the user here after checkout completion.
 * Activates subscription immediately for seamless local & live workflows.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rzSubId = searchParams.get('razorpay_subscription_id');
    const rzPaymentId = searchParams.get('razorpay_payment_id');

    const redirectUrl = new URL(request.url);

    if (!rzSubId || !rzPaymentId) {
        // Payment not completed — redirect back to dashboard
        redirectUrl.pathname = '/dashboard';
        redirectUrl.search = '?status=cancelled';
        return NextResponse.redirect(redirectUrl);
    }

    try {
        // Find subscription by Razorpay ID and activate it
        const sub = await prisma.subscription.findUnique({
            where: { razorpaySubscriptionId: rzSubId },
        });

        if (sub) {
            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });

            await prisma.tenant.update({
                where: { id: sub.tenantId },
                data: { plan: sub.planType },
            });
        }
    } catch (err) {
        console.error('[Subscription Callback] Activation error:', err);
    }

    // Redirect to dashboard
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = `?subscriptionActivated=true&paymentId=${rzPaymentId}`;
    return NextResponse.redirect(redirectUrl);
}
