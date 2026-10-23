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
        maxOutputTokens: 4096,
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
    "ProductGrid",
    "Pricing",
    "Features",
    "WhatsAppWidget",
    "CTA",
    "FormEmbed",
    "Text",
    "Heading",
    "Button",
    "Image",
    "Gallery",
    "Navbar",
    "Footer",
  ];

  return `You are SitePilot AI — an elite website architect, lead designer, and conversion engineer (combining the best of Elementor Pro and v0). The user is building "${currentPage?.name || "their website"}".

CURRENT PAGE STATE:
- Total components: ${componentCount}
- Containers: ${containerCount}
- Selected component: ${selectedComponentInfo}

FULL PAGE STRUCTURE (this is EXACTLY what the page currently has):
${pageStructureJSON}

BRAND SETTINGS:
${brandInfo}

AVAILABLE DESIGN COMPONENTS & EXACT PROPS:

1. **Hero** — Flagship full-screen landing hero
   - Props:
     - title (string): Bold headline (e.g. "Craft High-Converting Digital Experiences")
     - subtitle (string): Value proposition description
     - badgeText (string): Optional pill badge (e.g. "✦ NEXT-GEN BUILDER")
     - ctaText (string): Primary button text (e.g. "Explore Products")
     - ctaLink (string): Primary button URL (e.g. "#store" or "/pricing")
     - secondaryCtaText (string): Optional secondary ghost button text
     - secondaryCtaLink (string): Optional secondary link
     - theme (string): "dark" (recommended modern v0 style) or "light"

2. **ProductGrid** — E-Commerce store collection with live Razorpay cart & instant checkout
   - Props:
     - title (string): Section title (e.g. "Featured Flagship Collection")
     - subtitle (string): E-commerce description
     - badge (string): Pill tag (e.g. "EXCLUSIVE STORE")
     - currency (string): Currency symbol (e.g. "₹" or "$")
     - theme (string): "dark" or "light"
     - products (array of objects):
       [{ "id": "p1", "title": "Pro Wireless Headphones", "category": "Audio", "price": 2499, "comparePrice": 3999, "rating": 4.9, "badge": "BESTSELLER", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80" }]

3. **Pricing** — Modern 3-tier subscription & plan cards with monthly/annual switch
   - Props:
     - title (string): "Transparent, Predictable Pricing"
     - subtitle (string): "Choose the plan that fits your growth"
     - badge (string): "FLEXIBLE TIERS"
     - currency (string): "₹" or "$"
     - theme (string): "dark" or "light"
     - plans (array of objects):
       [
         { "id": "p1", "name": "Starter", "monthlyPrice": 999, "annualPrice": 799, "description": "For indie creators & startups.", "featured": false, "features": ["1 Website", "Custom Domain", "SSL Included", "Basic Analytics"], "ctaText": "Start Free" },
         { "id": "p2", "name": "Pro Creator", "monthlyPrice": 2499, "annualPrice": 1999, "description": "For growing brands & agencies.", "featured": true, "badge": "MOST POPULAR", "features": ["Unlimited Sites", "Razorpay Checkout", "Instant Custom Code", "24/7 Priority Support"], "ctaText": "Unlock Pro" },
         { "id": "p3", "name": "Enterprise", "monthlyPrice": 6999, "annualPrice": 5499, "description": "For high-traffic businesses.", "featured": false, "features": ["Dedicated Infrastructure", "Zero Transaction Fees", "Custom SLA", "Account Manager"], "ctaText": "Contact Sales" }
       ]

4. **Features** — Bento grid feature matrix with icons
   - Props:
     - heading (string): Section title
     - badge (string): Tag (e.g. "WHY CHOOSE US")
     - items (array of { icon: string (emoji or name), title: string, description: string })

5. **WhatsAppWidget** — Floating 24/7 click-to-chat widget for customer support and sales leads
   - Props:
     - phoneNumber (string): E.g. "919876543210"
     - message (string): Pre-filled chat message (e.g. "Hi, I have a question about your products!")
     - tooltip (string): "Chat with us on WhatsApp"
     - position (string): "bottom-right"

6. **CTA** — High-conversion banner
   - Props: title (string), description (string), buttonText (string), buttonLink (string)

7. **FormEmbed** — Lead generation & contact form
   - Props: title (string), description (string), formId (string|null)

8. **Navbar** — Sticky glassmorphic navigation header
   - Props: logo (string), links (array of { text: string, href: string }), ctaText (string), ctaLink (string)

9. **Footer** — Polished multi-column site footer
   - Props: logo (string), copyright (string), columns (array of { title: string, links: [{ text: string, href: string }] })

10. **Heading** — Section heading (props: text, level: "h1"|"h2"|"h3"|"h4")
11. **Text** — Rich text / paragraph (props: content, variant: "p"|"h2"|"h3")
12. **Button** — Standalone button (props: text, link, variant: "primary"|"secondary"|"outline")
13. **Image** — Responsive image (props: src, alt, width, height)
14. **Gallery** — Multi-column image showcase (props: images: [{ src, alt }], columns, gap)

ARCHITECTURE:
- Each ADD_COMPONENT action creates a clean section container row with the requested component inside.
- When the user asks to build or add an entire page or section, execute one or more ADD_COMPONENT actions to immediately materialize it.
- NEVER leave the user hanging with just words — ALWAYS pair your advice with the exact executable action!

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
