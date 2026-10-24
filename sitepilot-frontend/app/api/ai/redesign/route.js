import { NextResponse } from 'next/server';
import { redesignElement } from '@/lib/ai/gemini';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getPlanGuard, PlanGuardError, planGuardErrorResponse } from '@/lib/plan-guard';

export async function POST(request) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      selectedType,
      selectedData,
      prompt,
      keepContent,
      brandKit,
      theme,
      businessType,
      tenantId,
    } = body || {};

    if (!selectedType || !selectedData || !prompt) {
      return NextResponse.json(
        { error: 'Missing required parameters (selectedType, selectedData, prompt)' },
        { status: 400 }
      );
    }

    // 3. Optional plan guard verification
    if (tenantId) {
      try {
        const guard = await getPlanGuard(prisma, tenantId);
        guard.requireActive();
      } catch (err) {
        if (err instanceof PlanGuardError) {
          return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
        }
        throw err;
      }
    }

    // 4. Generate redesigned element with Gemini
    const result = await redesignElement({
      selectedType,
      selectedData,
      prompt,
      keepContent: Boolean(keepContent),
      brandKit,
      theme,
      businessType: businessType || 'website',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to redesign element with AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redesignedData: result.redesignedData,
      type: selectedType,
    });
  } catch (error) {
    console.error('AI redesign route error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI redesign', details: error.message },
      { status: 500 }
    );
  }
}
