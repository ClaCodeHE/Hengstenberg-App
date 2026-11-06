/**
 * Server-side AI Nutrition Assistant.
 *
 * Runs only on the server (Vercel function in production, Vite middleware in dev).
 * The API key is read from process.env and never reaches the browser.
 * If no key is configured the handler answers 503 and the client falls back to
 * the built-in offline demo assistant.
 */
import Anthropic from "@anthropic-ai/sdk";
import { products } from "../src/data/products.ts";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestBody {
  messages: ChatTurn[];
  profile?: Record<string, unknown>;
}

export interface ChatResult {
  status: number;
  body: { reply?: string; error?: string };
}

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const catalogue = products
  .map(
    (p) =>
      `- ${p.name} (${p.brand}) — ${p.short} Tags: ${p.tags.join(", ")}. Per 100 g: ${p.nutrition.energyKcal} kcal, ${p.nutrition.fibre} g fibre, ${p.nutrition.sugar} g sugar, ${p.nutrition.protein} g protein, ${p.nutrition.salt} g salt. Allergens: ${p.allergens.length ? p.allergens.join(", ") : "none declared"}. Sample price €${p.price.toFixed(2)}.`,
  )
  .join("\n");

const SYSTEM = `You are the AI Nutrition Assistant inside "Hengstenberg Smart Nutrition", a university innovation prototype app for the German food brand Hengstenberg (pickled vegetables, sauerkraut, red cabbage, vinegar).

How to answer:
- Be warm, practical and brief: at most ~150 words, short paragraphs or "- " bullet lists. Use **bold** sparingly for key items. No headings, no tables.
- Personalise every answer with the user's profile (goal, diet, allergies, time to cook, budget, student status) when it is relevant.
- When recommending Hengstenberg products, use the exact product names from the catalogue below so the app can show product cards. Only recommend products that fit the user's diet and allergies.
- Give general nutrition education, meal ideas, simple recipes (with time and rough cost) and vitamin/mineral information framed as general knowledge.
- You are not a doctor. Never diagnose deficiencies or conditions, never say the user needs a supplement, and never give dosing. For symptoms, medical conditions, pregnancy, eating disorders, medication or supplement questions, give general information only and recommend a doctor or registered dietitian.
- Product nutrition values and prices in this prototype are sample data; say so if the user asks for exact figures.
- Delivery and promotions in the app are demos; do not promise real delivery times or availability.

Hengstenberg product catalogue (sample data):
${catalogue}`;

function sanitize(body: unknown): ChatRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as ChatRequestBody).messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages = raw
    .filter(
      (m): m is ChatTurn =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "",
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // The conversation must start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  const profile = (body as ChatRequestBody).profile;
  return { messages, profile: profile && typeof profile === "object" ? profile : undefined };
}

export async function handleChat(body: unknown): Promise<ChatResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 503, body: { error: "AI not configured — client should use demo mode." } };
  }
  const req = sanitize(body);
  if (!req) return { status: 400, body: { error: "Invalid chat request." } };

  const profileText = req.profile
    ? `\n\nCurrent user profile (JSON, provided by the app):\n${JSON.stringify(req.profile).slice(0, 2000)}`
    : "";

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM + profileText,
      messages: req.messages,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return {
        status: 200,
        body: { reply: "I can't help with that one, but I'm happy to talk about meals, products or general nutrition." },
      };
    }
    const reply = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return { status: 200, body: { reply: reply || "Sorry, I couldn't come up with an answer. Could you rephrase?" } };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return { status: 429, body: { error: "The assistant is busy right now." } };
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      return { status: 502, body: { error: "AI service error." } };
    }
    console.error("Chat handler error", err);
    return { status: 500, body: { error: "Unexpected server error." } };
  }
}
