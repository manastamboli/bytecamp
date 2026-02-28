import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Popular Google Fonts categorized by style
const GOOGLE_FONTS_BY_CATEGORY = {
  modern: ['Inter', 'Poppins', 'Montserrat', 'Raleway', 'Work Sans', 'DM Sans', 'Manrope', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit'],
  classic: ['Merriweather', 'Playfair Display', 'Lora', 'Crimson Text', 'Libre Baskerville', 'EB Garamond', 'Cormorant', 'Spectral'],
  minimal: ['Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Nunito', 'Karla', 'Rubik', 'Lexend'],
  bold: ['Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Barlow', 'Titillium Web', 'Fjalla One'],
  elegant: ['Playfair Display', 'Cormorant Garamond', 'Cinzel', 'Bodoni Moda', 'Libre Baskerville', 'Crimson Pro'],
  playful: ['Quicksand', 'Comfortaa', 'Fredoka', 'Righteous', 'Pacifico', 'Caveat', 'Satisfy']
};

export async function POST(request) {
  try {
    const { brandMood, businessType, currentFonts } = await request.json();

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are a typography expert. Suggest 3 font pairings for a ${brandMood || 'modern'} ${businessType || 'business'} brand.

Available Google Fonts by category:
${Object.entries(GOOGLE_FONTS_BY_CATEGORY).map(([cat, fonts]) => `${cat}: ${fonts.join(', ')}`).join('\n')}

Requirements:
1. Each pairing should have a heading font and a body font
2. Fonts must be from the available list above
3. Pairings should complement each other (contrast in weight/style)
4. Match the brand mood: ${brandMood || 'modern'}
5. Provide a name and description for each pairing

Return ONLY valid JSON in this exact format:
{
  "pairings": [
    {
      "name": "Pairing Name",
      "description": "Brief description of the pairing style",
      "fonts": {
        "heading": "Font Name",
        "body": "Font Name"
      }
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('=== AI Font Response ===');
    console.log(text);
    console.log('=======================');

    // Parse and validate response
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Invalid AI response format');
    }

    if (!data.pairings || !Array.isArray(data.pairings)) {
      throw new Error('Invalid response structure');
    }

    // Validate and filter pairings
    const validPairings = data.pairings
      .filter(p => p.fonts && p.fonts.heading && p.fonts.body)
      .slice(0, 3);

    if (validPairings.length === 0) {
      // Fallback pairings based on mood
      const fallbackPairings = getFallbackPairings(brandMood);
      return NextResponse.json({ pairings: fallbackPairings });
    }

    return NextResponse.json({ pairings: validPairings });

  } catch (error) {
    console.error('Font suggestion error:', error);
    
    // Return fallback pairings on error
    const fallbackPairings = getFallbackPairings('modern');
    return NextResponse.json({ pairings: fallbackPairings });
  }
}

function getFallbackPairings(mood) {
  const pairings = {
    professional: [
      { name: 'Corporate Classic', description: 'Clean and trustworthy', fonts: { heading: 'Montserrat', body: 'Open Sans' } },
      { name: 'Modern Business', description: 'Contemporary and professional', fonts: { heading: 'Poppins', body: 'Inter' } },
      { name: 'Executive Suite', description: 'Sophisticated and refined', fonts: { heading: 'Playfair Display', body: 'Source Sans Pro' } }
    ],
    modern: [
      { name: 'Tech Forward', description: 'Sleek and contemporary', fonts: { heading: 'Space Grotesk', body: 'Inter' } },
      { name: 'Digital Edge', description: 'Modern and minimal', fonts: { heading: 'DM Sans', body: 'Roboto' } },
      { name: 'Clean Lines', description: 'Simple and effective', fonts: { heading: 'Outfit', body: 'Work Sans' } }
    ],
    playful: [
      { name: 'Fun & Friendly', description: 'Energetic and approachable', fonts: { heading: 'Quicksand', body: 'Nunito' } },
      { name: 'Creative Spark', description: 'Bold and expressive', fonts: { heading: 'Fredoka', body: 'Karla' } },
      { name: 'Cheerful Vibes', description: 'Warm and inviting', fonts: { heading: 'Comfortaa', body: 'Open Sans' } }
    ],
    luxury: [
      { name: 'Premium Elegance', description: 'Sophisticated and refined', fonts: { heading: 'Playfair Display', body: 'Lato' } },
      { name: 'High-End Classic', description: 'Timeless luxury', fonts: { heading: 'Cormorant Garamond', body: 'Montserrat' } },
      { name: 'Exclusive Style', description: 'Elegant and prestigious', fonts: { heading: 'Cinzel', body: 'Raleway' } }
    ],
    minimal: [
      { name: 'Pure Simplicity', description: 'Clean and uncluttered', fonts: { heading: 'Inter', body: 'Inter' } },
      { name: 'Essential Type', description: 'Minimal and focused', fonts: { heading: 'Roboto', body: 'Roboto' } },
      { name: 'Less is More', description: 'Simple elegance', fonts: { heading: 'Lato', body: 'Lato' } }
    ],
    bold: [
      { name: 'Strong Impact', description: 'Powerful and confident', fonts: { heading: 'Oswald', body: 'Roboto' } },
      { name: 'Bold Statement', description: 'Commanding presence', fonts: { heading: 'Bebas Neue', body: 'Open Sans' } },
      { name: 'Assertive Type', description: 'Strong and direct', fonts: { heading: 'Barlow', body: 'Work Sans' } }
    ]
  };

  return pairings[mood] || pairings.modern;
}
