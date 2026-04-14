import Groq from 'groq-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a recipe parser. Given recipe content (from a URL or pasted text), extract the recipe and return ONLY a valid JSON object matching this exact TypeScript interface — no markdown, no explanation, just raw JSON.

interface Recipe {
  title: string;
  description: string;
  servings: number;
  prepTime: number;   // minutes
  cookTime: number;   // minutes
  tags: string[];     // e.g. ["vegetarian", "batch-cook", "dinner"]
  ingredients: Array<{
    itemName: string;
    amount: number;
    unit: "g" | "ml" | "kg" | "l" | "tsp" | "tbsp" | "whole";
    tier: 1 | 2 | 3;  // 1=pantry staple, 2=regular pantry item, 3=specific/variable item
    optional?: boolean;
  }>;
  steps: Array<{
    text: string;
    timerSeconds?: number;  // only if the step mentions a specific duration
  }>;
  macrosPerServing?: {
    protein: number;  // grams
    carbs: number;
    fat: number;
    fibre: number;
  };
}

Tier guidelines:
- Tier 1: common pantry staples (oil, salt, pepper, garlic, common spices, stock, tinned tomatoes, soy sauce, vinegar)
- Tier 2: regular items kept stocked (eggs, dairy, onions, lemons, lentils, canned fish, yoghurt, leafy greens)
- Tier 3: specific ingredients you buy for this recipe (fresh meat, specific vegetables, specialty items, measured dry goods)

Unit conversion rules:
- Use "whole" for countable items (eggs, onions, lemons, cloves, cans)
- Convert cups to ml (1 cup = 240ml), oz to g (1oz = 28g), lb to g (1lb = 454g)
- Use "tsp"/"tbsp" for spice amounts

For timerSeconds: only include if the step says something like "cook for 20 minutes" — set it to that duration in seconds.

Always include at least 3 relevant tags from: vegetarian, vegan, batch-cook, quick, breakfast, lunch, dinner, high-protein, high-fibre, dairy-free, gluten-free, low-carb.`;

function stripHtml(html: string): string {
  // Remove script/style blocks
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|li|h[1-6]|section|article|br)>/gi, '\n');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function truncate(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n[content truncated]';
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GROQ_API_KEY is not set. Add it to .env.local and restart the dev server.' },
      { status: 500 }
    );
  }

  let body: { url?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, text } = body;
  if (!url && !text) {
    return Response.json({ error: 'Provide either a url or text field' }, { status: 400 });
  }

  let recipeContent: string;

  if (url) {
    let fetchedHtml: string;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeImporter/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchedHtml = await res.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json({ error: `Failed to fetch URL: ${msg}` }, { status: 422 });
    }
    recipeContent = truncate(stripHtml(fetchedHtml));
  } else {
    recipeContent = truncate(text!);
  }

  const groq = new Groq({ apiKey });

  let raw: string;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Parse this recipe into JSON:\n\n${recipeContent}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });
    raw = completion.choices[0]?.message?.content ?? '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Groq API error: ${msg}` }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Groq returned invalid JSON', raw }, { status: 502 });
  }

  // Validate minimum shape
  if (!parsed.title || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.steps)) {
    return Response.json({ error: 'Parsed recipe is missing required fields', raw }, { status: 422 });
  }

  return Response.json({ recipe: parsed });
}
