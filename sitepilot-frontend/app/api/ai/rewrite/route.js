import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { text, fieldType, context } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Extract context if provided
    const brandMood = context?.brandKit?.mood || '';
    const businessType = context?.businessType || '';
    const siteName = context?.siteName || '';
    const componentType = context?.componentType || '';

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      },
    });

    let contextBlock = '';
    if (siteName || businessType || brandMood) {
      contextBlock = `
WEBSITE CONTEXT:
- Site Name: ${siteName || 'Unknown'}
- Business Type: ${businessType || 'Unknown'}
- Brand Mood: ${brandMood || 'professional'}
- Component: ${componentType || 'Unknown'}

Use this context to write copy that perfectly fits this specific business.`;
    }

    const prompt = `You are an elite copywriter and conversion optimization specialist for high-performing landing pages.
The user has provided a piece of text that belongs to a "${fieldType}" field inside a "${componentType || 'website'}" component on their website.
${contextBlock}

Rewrite this text to make it significantly more professional, compelling, and engaging.

Rules:
1. Maintain the original meaning but make it sound vastly better.
2. If it's a Title or Heading, make it punchy, powerful, and short (under 10 words).
3. If it's a Subtitle or Description, elaborate beautifully but keep it concise (1-2 sentences max).
4. If it's Button Text, make it action-oriented and urgent (2-4 words).
5. Match the brand mood if provided (e.g. luxury, playful, corporate, modern).
6. Output ONLY the rewritten text. No quotes, no preamble, no explanation.

Original Text: "${text}"
Rewritten Text:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rewrittenText = response.text().trim();
    
    // Clean up any rogue quotes
    rewrittenText = rewrittenText.replace(/^["'](.*)["']$/, '$1');

    return NextResponse.json({
      success: true,
      text: rewrittenText
    });
  } catch (error) {
    console.error('AI Rewrite Error:', error);
    return NextResponse.json({ error: 'Failed to rewrite text' }, { status: 500 });
  }
}
