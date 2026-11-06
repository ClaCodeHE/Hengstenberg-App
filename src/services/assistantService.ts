/**
 * Assistant service. Tries the secure server-side AI endpoint first (/api/chat);
 * if it isn't configured or reachable, falls back to the offline demo assistant.
 * No API keys ever live in the client.
 */
import { demoReply, detectProducts, detectRecipes, type AssistantReply } from "../lib/assistant.ts";
import type { ChatMessage, Profile } from "../lib/types.ts";
import { goalInfo } from "../lib/nutrition.ts";

let aiAvailable: boolean | null = null;

export const assistantMode = () => aiAvailable;

function profileForAI(p: Profile | null) {
  if (!p) return undefined;
  return {
    name: p.name,
    occupation: p.occupation,
    goal: goalInfo(p.goal).label,
    age: p.age,
    activity: p.activity,
    diets: p.diets,
    allergies: p.allergies,
    avoidIngredients: p.avoid,
    timeToCook: p.cookTime,
    budget: p.budget,
    mealsPerDay: p.mealsPerDay,
    student: p.isStudent,
  };
}

export async function askAssistant(
  history: ChatMessage[],
  question: string,
  profile: Profile | null,
  todayRecipeIds: string[],
): Promise<AssistantReply & { source: "ai" | "demo" }> {
  if (aiAvailable !== false) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: [...history.slice(-12).map((m) => ({ role: m.role, content: m.text })), { role: "user", content: question }],
          profile: profileForAI(profile),
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        if (data.reply) {
          aiAvailable = true;
          return { text: data.reply, productIds: detectProducts(data.reply), recipeIds: detectRecipes(data.reply), source: "ai" };
        }
      }
      if (res.status === 503 || res.status === 404 || res.status === 405) aiAvailable = false;
    } catch {
      aiAvailable = false;
    }
  }
  // Small delay so the typing indicator feels natural in demo mode.
  await new Promise((r) => setTimeout(r, 650 + Math.random() * 500));
  return { ...demoReply(question, profile, todayRecipeIds), source: "demo" };
}
