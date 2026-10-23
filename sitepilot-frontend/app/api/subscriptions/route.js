/**
 * app/api/subscriptions/route.js
 *
 * GET  /api/subscriptions?tenantId=xxx  — Fetch current subscription for a tenant
 * POST /api/subscriptions               — Initiate a new subscription (Step 1 of lifecycle)
 *
 * POST body:
 * {
 *   tenantId: string,
 *   planType: 'STARTER' | 'PRO' | 'ENTERPRISE',
 *   billingCycle?: 'monthly' | 'yearly'
 * }
 *
 * Response on POST:
 * {
 *   subscriptionId: string,           // Internal DB id
 *   razorpaySubscriptionId: string,   // RZP sub id
 *   checkoutOptions: object,          // Pass to Razorpay.js on the client
 *   isNewCustomer: boolean,
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getPlanConfig } from '@/lib/plans';
import {
    createRazorpayCustomer,
    createRazorpaySubscription,
    buildCheckoutOptions,
    getRazorpayClient,
} from '@/lib/razorpay';
import { GRACE_PERIOD_DAYS } from '@/lib/plans';

export const runtime = 'nodejs';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        // Ensure the user belongs to this tenant
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
        });

        // Also fetch counts for usage display
        const [tenant, siteCount] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, tokenUsage: true, tokenLimit: true } }),
            prisma.site.count({ where: { tenantId } }),
        ]);

        // Count deployments in current billing cycle
        let deploymentsThisCycle = 0;
        if (subscription && subscription.currentPeriodStart) {
            deploymentsThisCycle = await prisma.deployment.count({
                where: {
                    site: { tenantId },
                    createdAt: { gte: subscription.currentPeriodStart },
                },
            });
        }

        return NextResponse.json({
            subscription: subscription ?? null,
            usage: {
                sites: siteCount,
                tokens: tenant?.tokenUsage ?? 0,
                tokenLimit: tenant?.tokenLimit ?? 0,
                deployments: deploymentsThisCycle,
            },
        });
    } catch (error) {
        console.error('[GET /api/subscriptions]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenantId, planType, billingCycle = 'monthly' } = body;

        if (!tenantId || !planType) {
            return NextResponse.json({ error: 'tenantId and planType are required' }, { status: 400 });
        }

        // Ensure the user is an OWNER of this tenant
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId, role: 'OWNER' },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Only tenant owners can manage subscriptions' }, { status: 403 });
        }

        // Validate plan
        const planConfig = getPlanConfig(planType);
        if (!planConfig) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }
        if (planType === 'FREE') {
            return NextResponse.json({ error: 'Cannot create a paid subscription for FREE plan' }, { status: 400 });
        }

        // Fetch tenant + existing subscription
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true, owner: true },
        });
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        let activePlanId = planConfig.razorpayPlanId;

        // Auto-create or find plan on Razorpay if API keys exist
        if (!activePlanId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            try {
                const rz = getRazorpayClient();
                const plansList = await rz.plans.all({ count: 20 });
                const existing = plansList.items?.find((p) =>
                    p.item?.name?.toLowerCase().includes(planType.toLowerCase())
                );
                if (existing) {
                    activePlanId = existing.id;
                } else {
                    const newPlan = await rz.plans.create({
                        period: billingCycle === 'yearly' ? 'yearly' : 'monthly',
                        interval: 1,
                        item: {
                            name: `SitePilot ${planConfig.displayName || planType}`,
                            amount: Math.round(planConfig.price * 100),
                            currency: planConfig.currency || 'INR',
                            description: `SitePilot ${planType} Subscription`,
                        },
                    });
                    activePlanId = newPlan.id;
                }
            } catch (err) {
                console.warn('Auto-create Razorpay plan note:', err.message);
            }
        }

        // Graceful Demo Activation if no Razorpay credentials configured yet
        if (!activePlanId || !process.env.RAZORPAY_KEY_ID) {
            await prisma.tenant.update({
                where: { id: tenantId },
                data: { plan: planType },
            });
            const sub = await prisma.subscription.upsert({
                where: { tenantId },
                create: {
                    tenantId,
                    userId: session.user.id,
                    razorpayCustomerId: 'cust_demo_' + Date.now(),
                    razorpaySubscriptionId: 'sub_demo_' + Date.now(),
                    razorpayPlanId: 'plan_demo_' + planType.toLowerCase(),
                    planType,
                    status: 'ACTIVE',
                    billingCycle,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                update: {
                    planType,
                    status: 'ACTIVE',
                    billingCycle,
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });

            return NextResponse.json({
                success: true,
                demo: true,
                message: `Successfully upgraded to ${planType}! (Demo mode activated; configure RAZORPAY_KEY_ID in .env for live payment flow)`,
                subscription: sub,
            });
        }

        let razorpayCustomerId = tenant.subscription?.razorpayCustomerId ?? null;
        let isNewCustomer = false;

        // ── Step 1: Ensure valid Razorpay customer exists ────────────────────────
        // If razorpayCustomerId is null OR is a demo ID, generate a real Razorpay customer
        if (!razorpayCustomerId || razorpayCustomerId.startsWith('cust_demo_') || !razorpayCustomerId.startsWith('cust_')) {
            const customer = await createRazorpayCustomer({
                name: tenant.owner.name ?? tenant.name,
                email: tenant.owner.email,
            });
            razorpayCustomerId = customer.id;
            isNewCustomer = true;
        }

        // ── Step 2: Create Razorpay subscription ────────────────────────────────
        let rzSubscription;
        try {
            rzSubscription = await createRazorpaySubscription({
                planId: activePlanId,
                customerId: razorpayCustomerId,
                totalCount: billingCycle === 'yearly' ? 12 : 120, // 12m or 10y
            });
        } catch (subErr) {
            console.warn('[Razorpay] Subscription attempt 1 failed:', subErr?.error?.description || subErr.message);
            // If the customer ID was stale/not found in this Razorpay account, recreate customer and retry
            if (subErr?.statusCode === 400 || subErr?.error?.code === 'BAD_REQUEST_ERROR' || subErr.message?.includes('invalid')) {
                const customer = await createRazorpayCustomer({
                    name: tenant.owner.name ?? tenant.name,
                    email: tenant.owner.email,
                });
                razorpayCustomerId = customer.id;
                isNewCustomer = true;
                rzSubscription = await createRazorpaySubscription({
                    planId: activePlanId,
                    customerId: razorpayCustomerId,
                    totalCount: billingCycle === 'yearly' ? 12 : 120,
                });
            } else {
                throw subErr;
            }
        }

        // ── Step 3: Upsert internal Subscription row ───────────────────────────
        const currentStatus = tenant.subscription?.status;
        const targetStatus = (currentStatus === 'ACTIVE' || currentStatus === 'TRIAL') ? currentStatus : 'PAUSED';

        const subscription = await prisma.subscription.upsert({
            where: { tenantId },
            create: {
                tenantId,
                userId: session.user.id,
                razorpayCustomerId,
                razorpaySubscriptionId: rzSubscription.id,
                razorpayPlanId: activePlanId,
                planType,
                status: 'PAUSED',       // Requires webhook or payment callback to flip to ACTIVE
                billingCycle,
            },
            update: {
                razorpayCustomerId,
                razorpaySubscriptionId: rzSubscription.id,
                razorpayPlanId: activePlanId,
                planType,
                status: targetStatus,
                billingCycle,
                cancelAtPeriodEnd: false,
                cancelledAt: null,
            },
        });

        // Determine base URL dynamically
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');

        // Build checkout options for the frontend
        const checkoutOptions = buildCheckoutOptions({
            subscriptionId: rzSubscription.id,
            name: 'SitePilot',
            description: `${planConfig.displayName} Plan – ${billingCycle}`,
            prefillEmail: session.user.email,
            prefillName: session.user.name ?? '',
            callbackUrl: `${appUrl}/api/subscriptions/callback`,
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            razorpaySubscriptionId: rzSubscription.id,
            checkoutOptions,
            isNewCustomer,
        });
    } catch (error) {
        console.error('[POST /api/subscriptions]', error);
        return NextResponse.json({ error: error.message || 'Failed to initiate subscription' }, { status: 500 });
    }
}
