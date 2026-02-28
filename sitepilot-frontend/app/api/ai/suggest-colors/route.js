import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { logoUrl, brandMood, businessType } = await request.json();

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are a professional brand designer. Generate 3 distinct color palettes for a ${businessType} brand with a ${brandMood} mood.

${logoUrl ? `The brand has a logo at: ${logoUrl}. Analyze the logo colors if possible.` : ''}

For each palette, provide:
- primary: Main brand color (hex)
- secondary: Supporting color (hex)
- tertiary: Accent color (hex)
- name: Creative palette name
- description: Why this palette works

Return ONLY valid JSON in this exact format:
{
  "palettes": [
    {
      "name": "Palette Name",
      "description": "Why it works",
      "colors": {
        "primary": "#HEX",
        "secondary": "#HEX",
        "tertiary": "#HEX"
      }
    }
  ]
}

Rules:
- Ensure good contrast for accessibility
- Colors should match the ${brandMood} mood
- Make palettes visually distinct from each other
- Use professional, modern color combinations`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // Try to extract JSON from markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Validate structure
    if (!data.palettes || !Array.isArray(data.palettes)) {
      throw new Error('Invalid palette structure');
    }

    return NextResponse.json({
      success: true,
      palettes: data.palettes,
    });
  } catch (error) {
    console.error('Color suggestion error:', error);
    
    // Fallback palettes
    const fallbackPalettes = [
      {
        name: "Professional Blue",
        description: "Clean and trustworthy, perfect for corporate brands",
        colors: {
          primary: "#2563EB",
          secondary: "#3B82F6",
          tertiary: "#60A5FA"
        }
      },
      {
        name: "Modern Purple",
        description: "Creative and innovative, great for tech companies",
        colors: {
          primary: "#7C3AED",
          secondary: "#8B5CF6",
          tertiary: "#A78BFA"
        }
      },
      {
        name: "Warm Orange",
        description: "Energetic and friendly, ideal for consumer brands",
        colors: {
          primary: "#EA580C",
          secondary: "#F97316",
          tertiary: "#FB923C"
        }
      }
    ];

    return NextResponse.json({
      success: true,
      palettes: fallbackPalettes,
      fallback: true,
    });
  }
}
