import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/ai/chat
 * 
 * Process natural language commands and stream AI responses with executable actions.
 * 
 * Request body:
 * - message: User's message
 * - context: { layoutJSON, brandKit, chatHistory, selectedComponentId, pageId }
 * 
 * Response: Streaming text/plain with AI response
 */
export async function POST(request) {
  try {
    const { message, context } = await request.json();

    // Validate required fields
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid message" },
        { status: 400 }
      );
    }

    if (!context || !context.layoutJSON || !context.pageId) {
      return NextResponse.json(
        { error: "Missing required context fields" },
        { status: 400 }
      );
    }

    // Build context-rich prompt
    const prompt = buildChatPrompt(message, context);

    // Configure Gemini model for streaming
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Generate streaming response with timeout
    const timeoutMs = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await model.generateContentStream(prompt);

      // Clear timeout on success
      clearTimeout(timeoutId);

      // Create ReadableStream for response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              controller.enqueue(new TextEncoder().encode(text));
            }
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            
            // Send error message to client
            const errorMessage = "\n\nI encountered an error while processing your request. Please try again.";
            controller.enqueue(new TextEncoder().encode(errorMessage));
            controller.close();
          }
        },
      });

      // Return streaming response
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (streamError) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (streamError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out after 30 seconds" },
          { status: 408 }
        );
      }
      
      throw streamError;
    }
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle rate limiting
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
          retryAfter: 60,
        },
        { 
          status: 429,
          headers: {
            "Retry-After": "60",
          },
        }
      );
    }

    // Return error response
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Build context-rich prompt for Gemini
 */
function buildChatPrompt(userMessage, context) {
  const {
    layoutJSON,
    brandKit,
    chatHistory = [],
    selectedComponentId,
  } = context;

  // Analyze current page state
  const currentPage = layoutJSON.pages?.[0];
  const componentCount = countComponents(currentPage?.layout || []);
  const containerCount = currentPage?.layout?.length || 0;

  // Get selected component info
  let selectedComponentInfo = "None";
  if (selectedComponentId) {
    const component = findComponentById(
      currentPage?.layout || [],
      selectedComponentId
    );
    if (component) {
      selectedComponentInfo = `${component.type} (${component.id})`;
    }
  }

  // Build detailed page structure so AI knows exactly what exists
  const pageStructure = (currentPage?.layout || []).map((container, ci) => {
    const cols = (container.columns || []).map((col, colI) => {
      const comps = (col.components || []).map(c => {
        const propsPreview = {};
        if (c.props) {
          // Include key text props so AI knows content
          for (const [k, v] of Object.entries(c.props)) {
            if (typeof v === 'string' && v.length < 120) propsPreview[k] = v;
            else if (typeof v === 'number') propsPreview[k] = v;
          }
        }
        return { type: c.type, id: c.id, props: propsPreview };
      });
      return { columnIndex: colI, components: comps };
    });
    return { containerIndex: ci, id: container.id, columns: cols };
  });

  const pageStructureJSON = JSON.stringify(pageStructure, null, 2);

  // Format brand kit info
  const brandInfo = brandKit
    ? `
- Primary color: ${brandKit.colors?.primary || "Not set"}
- Secondary color: ${brandKit.colors?.secondary || "Not set"}
- Heading font: ${brandKit.fonts?.heading || "Not set"}
- Body font: ${brandKit.fonts?.body || "Not set"}
- Mood: ${brandKit.mood || "Not set"}`
    : "- No brand kit configured";

  // Format chat history (last 5 messages for context)
  const recentHistory = chatHistory
    .slice(-5)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Available components
  const availableComponents = [
    "Hero",
    "CTA",
    "Features",
    "FormEmbed",
    "Text",
    "Heading",
    "Button",
    "Image",
    "Gallery",
    "Navbar",
    "Footer",
  ];

  return `You are an expert web designer helping build a website. The user is working on "${currentPage?.name || "their page"}".

CURRENT PAGE STATE:
- Total components: ${componentCount}
- Containers: ${containerCount}
- Selected component: ${selectedComponentInfo}

FULL PAGE STRUCTURE (this is EXACTLY what the page currently has — do NOT suggest adding a component that already exists!):
${pageStructureJSON}

BRAND SETTINGS:
${brandInfo}

AVAILABLE COMPONENTS WITH EXACT PROPS (ONLY USE THESE):

1. **Hero** — Full-width banner
   - Props: title (string), subtitle (string), ctaText (string), ctaLink (string), backgroundImage (string)

2. **CTA** — Call-to-action section
   - Props: title (string), description (string), buttonText (string), buttonLink (string)

3. **Features** — Feature grid cards
   - Props: heading (string), items (array of {icon, title, description})
   - IMPORTANT: use "heading" NOT "title", use "items" NOT "features"

4. **FormEmbed** — Contact form
   - Props: formId (string|null), title (string), description (string)

5. **Text** — Rich text paragraph
   - Props: content (string), variant (string: "p"|"h1"|"h2"|"h3")

6. **Heading** — Section heading
   - Props: text (string), level (string: "h1"|"h2"|"h3"|"h4"|"h5"|"h6")

7. **Button** — Action button
   - Props: text (string), link (string), variant (string: "primary"|"secondary"|"outline")

8. **Image** — Image block
   - Props: src (string), alt (string), width (number), height (number)

9. **Gallery** — Image gallery grid
   - Props: images (array of {src, alt}), columns (number), gap (number)

10. **Navbar** — Navigation bar
    - Props: logo (string), links (array of {text, href}), ctaText (string), ctaLink (string)

11. **Footer** — Footer section
    - Props: logo (string), copyright (string), columns (array of {title, links: [{text, href}]})

ARCHITECTURE: Each ADD_COMPONENT action creates a NEW container (full-width row) with the component inside.
To build a multi-section page, use MULTIPLE ADD_COMPONENT actions in sequence.

CONVERSATION HISTORY:
${recentHistory || "No previous conversation"}

USER REQUEST: "${userMessage}"

INSTRUCTIONS:
1. ALWAYS take action when the user asks to add/modify components
2. Be brief and action-oriented - don't just give advice, DO IT
3. If they ask "what should I add?", suggest AND add a component immediately
4. Use EXACT prop names from the component list above
5. Apply brand colors from the brand settings
6. If unclear, add the most logical component and explain what you did
7. NEVER suggest adding a component type that already exists on the page (check FULL PAGE STRUCTURE above)
8. For custom section designs, combine primitive components: use a Heading + Text + Button in separate actions to build a custom section
9. You can add MULTIPLE components in one response using multiple actions in the actions array

RESPONSE RULES:
- User asks to add something -> ADD IT immediately with actions
- User asks "what should I add?" -> ADD a relevant component with actions
- User asks a question -> Answer briefly AND suggest an action
- User asks to "design" or "build" a section -> Use multiple sequential ADD_COMPONENT actions with Heading, Text, Button, Image to build it
- Be decisive and proactive, not passive
- Talk to the user naturally!

RESPONSE FORMAT:
Provide your conversational, friendly response directly as plain text. Do NOT wrap your text inside JSON.
If you are performing actions, output a single JSON code block at the VERY END of your response with the actions array.

Example — adding one component:
I'll add a Features section to showcase your key benefits.

\`\`\`json
{
  "actions": [{
    "type": "ADD_COMPONENT",
    "payload": {
      "componentType": "Features",
      "position": "bottom",
      "props": {
        "heading": "Why Choose Us",
        "items": [
          {"icon": "⚡", "title": "Fast", "description": "Lightning performance"},
          {"icon": "🔒", "title": "Secure", "description": "Enterprise-grade security"},
          {"icon": "💡", "title": "Easy", "description": "Intuitive interface"}
        ]
      }
    }
  }],
  "confidence": 0.95
}
\`\`\`

Example — building a custom section with multiple components:
I'll build you an About section using a heading, description text, and a call-to-action button.

\`\`\`json
{
  "actions": [
    {
      "type": "ADD_COMPONENT",
      "payload": {
        "componentType": "Heading",
        "position": "bottom",
        "props": { "text": "About Our Restaurant", "level": "h2" }
      }
    },
    {
      "type": "ADD_COMPONENT",
      "payload": {
        "componentType": "Text",
        "position": "bottom",
        "props": { "content": "We have been serving exquisite cuisine for over 20 years, combining traditional techniques with modern innovation.", "variant": "p" }
      }
    },
    {
      "type": "ADD_COMPONENT",
      "payload": {
        "componentType": "Button",
        "position": "bottom",
        "props": { "text": "Learn More", "link": "#about", "variant": "primary" }
      }
    }
  ],
  "confidence": 0.9
}
\`\`\`

CRITICAL RULES:
1. Provide plain text first, NOT a JSON block containing text.
2. Put any actions inside a \`\`\`json block at the end.
3. If no actions are needed, do not output any json.
4. Only use components from AVAILABLE COMPONENTS list with EXACT prop names.
5. Apply brand colors when creating components.
6. Be helpful and action-oriented.
7. You can use multiple actions to build complex layouts.

Generate your response now:`;
}

/**
 * Count total components in layout
 */
function countComponents(layout) {
  let count = 0;
  
  if (!Array.isArray(layout)) return 0;

  for (const container of layout) {
    if (container.columns) {
      for (const column of container.columns) {
        if (column.components) {
          count += column.components.length;
        }
      }
    }
  }

  return count;
}

/**
 * Find component by ID in layout
 */
function findComponentById(layout, componentId) {
  if (!Array.isArray(layout)) return null;

  for (const container of layout) {
    if (container.columns) {
      for (const column of container.columns) {
        if (column.components) {
          const component = column.components.find((c) => c.id === componentId);
          if (component) return component;
        }
      }
    }
  }

  return null;
}
