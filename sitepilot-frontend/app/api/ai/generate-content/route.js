import { NextResponse } from 'next/server';
import { generateComponentContent } from '@/lib/ai/gemini';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getPlanGuard, PlanGuardError, planGuardErrorResponse } from '@/lib/plan-guard';

export async function POST(request) {
  try {
    // Auth check
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { componentType, fieldName, context, businessType, tenantId } = body;

    if (!componentType || !fieldName) {
      return NextResponse.json(
        { error: 'Component type and field name are required' },
        { status: 400 }
      );
    }

    // ── PLAN GUARD: Token limit check ─────────────────────────────────────
    if (tenantId) {
      try {
        const guard = await getPlanGuard(prisma, tenantId);
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { tokenUsage: true },
        });
        guard.requireActive();
        guard.checkTokenLimit(tenant?.tokenUsage ?? 0, 500); // ~500 tokens per generation
      } catch (err) {
        if (err instanceof PlanGuardError) {
          return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
        }
        throw err;
      }
    }

    // Generate content with Gemini
    const result = await generateComponentContent({
      componentType,
      context: context || `Generate ${fieldName} for ${componentType}`,
      businessType: businessType || 'business'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Extract the specific field value
    const fieldValue = result.content[fieldName] || result.content.content || result.content.text;

    // Track token usage
    if (tenantId && result.success) {
      try {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { tokenUsage: { increment: 500 } }, // Approximate per generation
        });
      } catch { /* non-fatal — usage tracking failure shouldn't break the response */ }
    }

    return NextResponse.json({
      success: true,
      content: fieldValue,
      fullContent: result.content
    });

  } catch (error) {
    console.error('AI content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', details: error.message },
      { status: 500 }
    );
  }
}
