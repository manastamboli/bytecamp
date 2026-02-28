import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { layoutJSON, brandKit, siteInfo } = await request.json();

    if (!layoutJSON || !layoutJSON.pages || layoutJSON.pages.length === 0) {
      return NextResponse.json({ error: 'Invalid layout data' }, { status: 400 });
    }

    const page = layoutJSON.pages[0];
    // Support both 'containers' and 'layout' keys
    const containers = page.layout || page.containers || [];

    // Analyze page structure
    const analysis = analyzePageStructure(containers);

    // Generate AI suggestions
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildAnalysisPrompt(analysis, brandKit, siteInfo);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('=== AI Copilot Analysis ===');
    console.log(text);
    console.log('===========================');

    let suggestions;
    try {
      let cleanText = text;
      const match = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (match) {
        cleanText = match[1];
      } else {
        cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      }
      
      const parsed = JSON.parse(cleanText);
      suggestions = parsed.suggestions || parsed;
      // If it returned an array directly
      if (Array.isArray(suggestions)) {
        suggestions = { suggestions };
      }
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      // Fallback suggestions
      suggestions = getFallbackSuggestions(analysis);
    }

    // Validate and enhance suggestions
    const validSuggestions = (suggestions.suggestions || [])
      .filter(s => s.title && s.description && s.action)
      .slice(0, 5) // Max 5 suggestions
      .map((s, idx) => ({
        id: `suggestion-${Date.now()}-${idx}`,
        ...s,
        priority: s.priority || 'medium',
        category: s.category || 'improvement',
      }));

    return NextResponse.json({
      success: true,
      suggestions: validSuggestions,
      analysis: {
        componentCount: analysis.componentCount,
        hasHero: analysis.hasHero,
        hasCTA: analysis.hasCTA,
        hasTestimonials: analysis.hasTestimonials,
        hasContactForm: analysis.hasContactForm,
        containerCount: analysis.containerCount,
      },
    });
  } catch (error) {
    console.error('AI analysis error:', error);

    // Return fallback suggestions on error
    return NextResponse.json({
      success: true,
      suggestions: getFallbackSuggestions({ componentCount: 0 }),
      analysis: {},
    });
  }
}

function analyzePageStructure(containers) {
  const analysis = {
    containerCount: containers.length,
    componentCount: 0,
    componentTypes: {},
    hasHero: false,
    hasCTA: false,
    hasTestimonials: false,
    hasContactForm: false,
    hasNavbar: false,
    hasFooter: false,
    hasFeatures: false,
    hasGallery: false,
    textComponents: 0,
    imageComponents: 0,
    buttonComponents: 0,
  };

  containers.forEach(container => {
    container.columns?.forEach(column => {
      column.components?.forEach(component => {
        analysis.componentCount++;

        const type = component.type;
        analysis.componentTypes[type] = (analysis.componentTypes[type] || 0) + 1;

        // Track specific components
        if (type === 'Hero') analysis.hasHero = true;
        if (type === 'CTA') analysis.hasCTA = true;
        if (type === 'Testimonials') analysis.hasTestimonials = true;
        if (type === 'FormEmbed') analysis.hasContactForm = true;
        if (type === 'Navbar') analysis.hasNavbar = true;
        if (type === 'Footer') analysis.hasFooter = true;
        if (type === 'Features') analysis.hasFeatures = true;
        if (type === 'Gallery') analysis.hasGallery = true;
        if (type === 'Text') analysis.textComponents++;
        if (type === 'Image') analysis.imageComponents++;
        if (type === 'Button') analysis.buttonComponents++;
      });
    });
  });

  return analysis;
}

function buildAnalysisPrompt(analysis, brandKit, siteInfo) {
  const brandMood = brandKit?.mood || 'professional';
  const primaryColor = brandKit?.colors?.primary || '#3b82f6';
  const businessType = siteInfo?.businessType || 'business';
  const siteName = siteInfo?.name || 'this website';
  const hasHero = analysis.hasHero ? 'Yes' : 'No';
  const hasCTA = analysis.hasCTA ? 'Yes' : 'No';
  const hasTestimonials = analysis.hasTestimonials ? 'Yes' : 'No';
  const hasContactForm = analysis.hasContactForm ? 'Yes' : 'No';

  const componentBreakdown = Object.entries(analysis.componentTypes).length > 0
    ? Object.entries(analysis.componentTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')
    : '- No components yet';

  return `You are an expert web design consultant analyzing a landing page for "${siteName}", a ${businessType} website. Provide actionable suggestions to improve conversion and user experience.

BRAND CONTEXT:
- Business Type: ${businessType}
- Brand Mood: ${brandMood}
- Primary Color: ${primaryColor}
- Site Name: ${siteName}

PAGE ANALYSIS:
- Total Components: ${analysis.componentCount}
- Containers: ${analysis.containerCount}
- Has Hero Section: ${hasHero}
- Has Call-to-Action: ${hasCTA}
- Has Features Section: ${hasTestimonials}
- Has Contact Form: ${hasContactForm}

Component Breakdown:
${componentBreakdown}

AVAILABLE COMPONENTS (ONLY USE THESE):
- Hero: Main banner with title, subtitle, CTA button
- CTA: Call-to-action section with title, description, button
- Features: Grid of feature cards with icons (can be used for testimonials/benefits)
- FormEmbed: Contact form
- Text: Paragraph text
- Heading: Section headings
- Image: Images
- Button: Action buttons
- Gallery: Image gallery
- Video: Embedded videos

TASK: Provide 3-5 specific, actionable suggestions to improve this page. Focus on:
1. Missing essential elements (Hero, CTA, Features, contact form)
2. Conversion optimization
3. User experience improvements
4. Content structure
5. Visual hierarchy

CRITICAL: Only suggest components from the AVAILABLE COMPONENTS list above. Do NOT suggest "Testimonials" - use "Features" instead for social proof.

For each suggestion, provide:
- title: Short, actionable title (max 50 chars)
- description: Clear explanation of why this helps (max 120 chars)
- action: Specific action object with type and data
- priority: "high", "medium", or "low"
- category: "missing", "improvement", "optimization", or "accessibility"

ACTION TYPES:
1. "add_component" - Add a new component
   { type: "add_component", componentType: "Hero|CTA|Features|FormEmbed|Text|Image|Button|Gallery|Video", position: "top|bottom" }

2. "improve_component" - Enhance existing component
   { type: "improve_component", componentType: "Hero|CTA|Text", improvement: "stronger_cta|better_copy|add_image" }

3. "reorder" - Suggest reordering
   { type: "reorder", suggestion: "Move CTA higher|Add features before contact" }

EXAMPLES OF GOOD SUGGESTIONS:
- Add Hero Section (if missing)
- Add Call-to-Action (if missing)
- Add Features Section for benefits/social proof (if missing)
- Add Contact Form (if missing)
- Improve Hero Copy (if hero exists but weak)

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "title": "Add Hero Section",
      "description": "Hero sections increase engagement by 40% and clearly communicate your value proposition",
      "action": {
        "type": "add_component",
        "componentType": "Hero",
        "position": "top"
      },
      "priority": "high",
      "category": "missing"
    }
  ]
}`;
}

function getFallbackSuggestions(analysis) {
  const suggestions = [];

  if (!analysis.hasHero) {
    suggestions.push({
      id: `suggestion-${Date.now()}-1`,
      title: 'Add Hero Section',
      description: 'Hero sections grab attention and communicate your value proposition immediately',
      action: {
        type: 'add_component',
        componentType: 'Hero',
        position: 'top',
      },
      priority: 'high',
      category: 'missing',
    });
  }

  if (!analysis.hasCTA) {
    suggestions.push({
      id: `suggestion-${Date.now()}-2`,
      title: 'Add Call-to-Action',
      description: 'CTA sections guide visitors to take action and improve conversion rates',
      action: {
        type: 'add_component',
        componentType: 'CTA',
        position: 'bottom',
      },
      priority: 'high',
      category: 'missing',
    });
  }

  if (!analysis.hasTestimonials) {
    suggestions.push({
      id: `suggestion-${Date.now()}-3`,
      title: 'Add Social Proof',
      description: 'Testimonials build trust and increase conversions by up to 34%',
      action: {
        type: 'add_component',
        componentType: 'Features',
        position: 'bottom',
      },
      priority: 'medium',
      category: 'improvement',
    });
  }

  if (!analysis.hasContactForm) {
    suggestions.push({
      id: `suggestion-${Date.now()}-4`,
      title: 'Add Contact Form',
      description: 'Make it easy for visitors to reach you with a contact form',
      action: {
        type: 'add_component',
        componentType: 'FormEmbed',
        position: 'bottom',
      },
      priority: 'medium',
      category: 'missing',
    });
  }

  if (analysis.componentCount < 3) {
    suggestions.push({
      id: `suggestion-${Date.now()}-5`,
      title: 'Add More Content',
      description: 'Your page needs more content to engage visitors and improve SEO',
      action: {
        type: 'add_component',
        componentType: 'Features',
        position: 'bottom',
      },
      priority: 'medium',
      category: 'improvement',
    });
  }

  return suggestions.slice(0, 5);
}
