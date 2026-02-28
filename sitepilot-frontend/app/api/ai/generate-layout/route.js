import { NextResponse } from 'next/server';
import { generateLayout } from '@/lib/ai/gemini';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
    const { description, businessType, pageType, brandKit } = body;

    if (!description || !businessType) {
      return NextResponse.json(
        { error: 'Description and business type are required' },
        { status: 400 }
      );
    }

    // Generate layout with Gemini (now with brand kit!)
    const result = await generateLayout({
      description,
      businessType,
      pageType: pageType || 'home',
      brandKit  // Pass brand kit to AI
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          fallback: result.fallback,
          message: 'AI generation failed, using fallback layout'
        },
        { status: 200 } // Still return 200 with fallback
      );
    }

    return NextResponse.json({
      success: true,
      layout: result.layout,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate layout', details: error.message },
      { status: 500 }
    );
  }
}
