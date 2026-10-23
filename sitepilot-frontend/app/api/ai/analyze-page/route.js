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
        maxOutputTokens: 4096,
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
      const rawList = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
      suggestions = { suggestions: rawList };
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      suggestions = { suggestions: getFallbackSuggestions(analysis) };
    }

    const COMPONENT_MAP = {
      hero: 'Hero',
      banner: 'Hero',
      productgrid: 'ProductGrid',
      products: 'ProductGrid',
      product: 'ProductGrid',
      store: 'ProductGrid',
      shop: 'ProductGrid',
      ecommerce: 'ProductGrid',
      pricing: 'Pricing',
      plans: 'Pricing',
      pricingtable: 'Pricing',
      features: 'Features',
      feature: 'Features',
      bento: 'Features',
      testimonials: 'Features',
      testimonialcarousel: 'Features',
      socialproof: 'Features',
      reviews: 'Features',
      whatsapp: 'WhatsAppWidget',
      whatsappwidget: 'WhatsAppWidget',
      livechatwidget: 'WhatsAppWidget',
      livechat: 'WhatsAppWidget',
      chat: 'WhatsAppWidget',
      cta: 'CTA',
      calltoaction: 'CTA',
      formembed: 'FormEmbed',
      contact: 'FormEmbed',
      contactform: 'FormEmbed',
      gallery: 'Gallery',
      navbar: 'Navbar',
      footer: 'Footer',
    };

    // Normalize component types and actions
    const rawSuggestions = suggestions.suggestions || [];
    const validSuggestions = [];

    for (let i = 0; i < rawSuggestions.length; i++) {
      const s = rawSuggestions[i];
      if (!s.title || !s.description) continue;

      let action = s.action || { type: 'add_component', componentType: 'Features', position: 'bottom' };
      let compType = (action.componentType || '').toLowerCase().replace(/[^a-z]/g, '');
      const mappedType = COMPONENT_MAP[compType] || (action.type === 'add_component' ? 'Features' : null);

      if (mappedType) {
        action = {
          type: 'add_component',
          componentType: mappedType,
          position: action.position || 'bottom',
        };
      } else {
        action = {
          type: 'add_component',
          componentType: 'Features',
          position: 'bottom',
        };
      }

      validSuggestions.push({
        id: `suggestion-${Date.now()}-${i}`,
        title: s.title,
        description: s.description,
        action,
        priority: s.priority || 'high',
        category: s.category || 'improvement',
      });

      if (validSuggestions.length >= 5) break;
    }

    // If fewer than 3 suggestions came through, merge from rich fallbacks
    if (validSuggestions.length < 4) {
      const fallbacks = getFallbackSuggestions(analysis);
      for (const fb of fallbacks) {
        if (!validSuggestions.some(v => v.action?.componentType === fb.action?.componentType)) {
          validSuggestions.push(fb);
        }
        if (validSuggestions.length >= 5) break;
      }
    }

    return NextResponse.json({
      success: true,
      suggestions: validSuggestions,
      analysis: {
        componentCount: analysis.componentCount,
        hasHero: analysis.hasHero,
        hasCTA: analysis.hasCTA,
        hasFeatures: analysis.hasFeatures,
        hasProductGrid: analysis.hasProductGrid,
        hasPricing: analysis.hasPricing,
        hasWhatsApp: analysis.hasWhatsApp,
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
    hasFeatures: false,
    hasProductGrid: false,
    hasPricing: false,
    hasWhatsApp: false,
    hasContactForm: false,
    hasNavbar: false,
    hasFooter: false,
    hasGallery: false,
    textComponents: 0,
    imageComponents: 0,
    buttonComponents: 0,
  };

  containers.forEach(container => {
    // Collect components from both direct container.components and column.components
    const directComponents = container.components || [];
    const colComponents = (container.columns || []).flatMap(col => col.components || []);
    const allComponents = [...directComponents, ...colComponents];

    allComponents.forEach(component => {
      analysis.componentCount++;

      const type = component.type;
      analysis.componentTypes[type] = (analysis.componentTypes[type] || 0) + 1;

      // Track specific components
      if (type === 'Hero') analysis.hasHero = true;
      if (type === 'CTA') analysis.hasCTA = true;
      if (type === 'Features') analysis.hasFeatures = true;
      if (type === 'ProductGrid') analysis.hasProductGrid = true;
      if (type === 'Pricing') analysis.hasPricing = true;
      if (type === 'WhatsAppWidget') analysis.hasWhatsApp = true;
      if (type === 'FormEmbed') analysis.hasContactForm = true;
      if (type === 'Navbar') analysis.hasNavbar = true;
      if (type === 'Footer') analysis.hasFooter = true;
      if (type === 'Gallery') analysis.hasGallery = true;
      if (type === 'Text') analysis.textComponents++;
      if (type === 'Image') analysis.imageComponents++;
      if (type === 'Button') analysis.buttonComponents++;
    });
  });

  return analysis;
}

function buildAnalysisPrompt(analysis, brandKit, siteInfo) {
  const brandMood = brandKit?.mood || 'modern & high-converting';
  const primaryColor = brandKit?.colors?.primary || '#d3ff4a';
  const businessType = siteInfo?.businessType || 'commercial store & landing page';
  const siteName = siteInfo?.name || 'this website';
  const hasHero = analysis.hasHero ? 'Yes' : 'No';
  const hasCTA = analysis.hasCTA ? 'Yes' : 'No';
  const hasFeatures = analysis.hasFeatures ? 'Yes' : 'No';
  const hasProductGrid = analysis.hasProductGrid ? 'Yes' : 'No';
  const hasPricing = analysis.hasPricing ? 'Yes' : 'No';
  const hasWhatsApp = analysis.hasWhatsApp ? 'Yes' : 'No';
  const hasContactForm = analysis.hasContactForm ? 'Yes' : 'No';

  const componentBreakdown = Object.entries(analysis.componentTypes).length > 0
    ? Object.entries(analysis.componentTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')
    : '- No components yet';

  return `You are an elite web architect and conversion rate optimization (CRO) consultant analyzing "${siteName}", a ${businessType}. Provide high-impact, actionable suggestions.

BRAND CONTEXT:
- Business Type: ${businessType}
- Brand Mood: ${brandMood}
- Primary Color: ${primaryColor}
- Site Name: ${siteName}

PAGE INVENTORY:
- Total Components: ${analysis.componentCount}
- Containers: ${analysis.containerCount}
- Has Hero Section: ${hasHero}
- Has Call-to-Action: ${hasCTA}
- Has Bento Grid Features: ${hasFeatures}
- Has Product Store (E-Commerce): ${hasProductGrid}
- Has Pricing Tiers: ${hasPricing}
- Has WhatsApp Chat Widget: ${hasWhatsApp}
- Has Contact / Lead Form: ${hasContactForm}

Component Breakdown:
${componentBreakdown}

AVAILABLE COMPONENTS (ONLY USE THESE):
- Hero: Main flagship banner with title, subtitle, badge, dual CTAs
- ProductGrid: E-commerce collection with instant Razorpay checkout
- Pricing: 3-tier subscription / plan table (Starter, Pro, Enterprise)
- Features: Bento grid of feature cards with icons & badges
- WhatsAppWidget: Floating 24/7 click-to-chat WhatsApp widget
- CTA: High-impact call-to-action banner
- FormEmbed: Lead capture & contact form
- Gallery: Multi-column image showcase
- Navbar: Sticky navigation header
- Footer: Multi-column footer

TASK: Provide 3-5 high-value suggestions to upgrade this website. Prioritize missing essential sections:
- If missing ProductGrid or store, suggest adding Featured Products with Razorpay checkout!
- If missing Pricing, suggest adding transparent pricing tiers!
- If missing Hero, suggest adding a high-converting Hero banner!
- If missing Features, suggest adding Bento Grid features!
- If missing WhatsApp, suggest adding a WhatsApp chat widget for 24/7 customer leads!

For each suggestion, return:
- title: Short, punchy title (max 45 chars)
- description: Clear rationale of why this boosts conversions (max 120 chars)
- action: { type: "add_component", componentType: "Hero|ProductGrid|Pricing|Features|WhatsAppWidget|CTA|FormEmbed|Gallery", position: "top|bottom" }
- priority: "high", "medium", or "low"
- category: "missing", "ecommerce", "conversion", or "improvement"

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "title": "Add E-Commerce Product Store",
      "description": "Showcase flagship products with instant cart & Razorpay checkout to start selling immediately.",
      "action": {
        "type": "add_component",
        "componentType": "ProductGrid",
        "position": "bottom"
      },
      "priority": "high",
      "category": "ecommerce"
    }
  ]
}`;
}

function getFallbackSuggestions(analysis) {
  const suggestions = [];

  if (!analysis.hasHero) {
    suggestions.push({
      id: `suggestion-${Date.now()}-hero`,
      title: 'Add Flagship Hero Section',
      description: 'Capture attention instantly with a bold headline, spotlight glow, and clear call-to-action.',
      action: {
        type: 'add_component',
        componentType: 'Hero',
        position: 'top',
      },
      priority: 'high',
      category: 'missing',
    });
  }

  if (!analysis.hasProductGrid) {
    suggestions.push({
      id: `suggestion-${Date.now()}-store`,
      title: 'Add Featured Product Store',
      description: 'Enable e-commerce with hand-picked hardware, instant Razorpay checkout & slide-out cart.',
      action: {
        type: 'add_component',
        componentType: 'ProductGrid',
        position: 'bottom',
      },
      priority: 'high',
      category: 'ecommerce',
    });
  }

  if (!analysis.hasFeatures) {
    suggestions.push({
      id: `suggestion-${Date.now()}-feat`,
      title: 'Add Bento Grid Features',
      description: 'Highlight key architectural advantages and benefits with sleek visual cards and icons.',
      action: {
        type: 'add_component',
        componentType: 'Features',
        position: 'bottom',
      },
      priority: 'high',
      category: 'missing',
    });
  }

  if (!analysis.hasPricing) {
    suggestions.push({
      id: `suggestion-${Date.now()}-price`,
      title: 'Add Transparent Pricing Plans',
      description: 'Present Starter, Pro, and Enterprise tiers with monthly/annual toggle for predictable revenue.',
      action: {
        type: 'add_component',
        componentType: 'Pricing',
        position: 'bottom',
      },
      priority: 'medium',
      category: 'conversion',
    });
  }

  if (!analysis.hasWhatsApp) {
    suggestions.push({
      id: `suggestion-${Date.now()}-wa`,
      title: 'Add WhatsApp Chat Support',
      description: 'Convert visitors into direct inquiries with a 1-click floating WhatsApp chat button.',
      action: {
        type: 'add_component',
        componentType: 'WhatsAppWidget',
        position: 'bottom',
      },
      priority: 'medium',
      category: 'conversion',
    });
  }

  if (!analysis.hasCTA) {
    suggestions.push({
      id: `suggestion-${Date.now()}-cta`,
      title: 'Add High-Impact CTA Banner',
      description: 'Drive conversion at the bottom of the page with a compelling headline and action button.',
      action: {
        type: 'add_component',
        componentType: 'CTA',
        position: 'bottom',
      },
      priority: 'medium',
      category: 'conversion',
    });
  }

  return suggestions.slice(0, 5);
}
