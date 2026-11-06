/**
 * Offline demo assistant. Produces personalised, rule-based answers when no AI
 * backend is configured. Mirrors the safety rules used for the real AI.
 */
import { products, productById } from "../data/products.ts";
import { recipes, recipeById } from "../data/recipes.ts";
import { goalInfo, computeTargets, COOK_TIMES, BUDGETS, DIETS } from "./nutrition.ts";
import { productFits, recipeFits, recommendedProducts } from "./recommend.ts";
import type { Goal, Profile, Recipe } from "./types.ts";

export interface AssistantReply {
  text: string;
  productIds?: string[];
  recipeIds?: string[];
  suggestions?: string[];
}

export const STARTER_QUESTIONS = [
  "What should I eat today?",
  "I want to lose weight. What products do you recommend?",
  "Which foods are high in fibre?",
  "What can I prepare in 10 minutes?",
  "Which Hengstenberg products fit my diet?",
  "What vitamins and minerals are important for my goals?",
];

const DISCLAIMER = "_General nutrition guidance — not medical advice._";

const has = (t: string, re: RegExp) => re.test(t);
const first = (p: Profile | null) => (p?.name ? `, ${p.name}` : "");
const dietLabel = (p: Profile) =>
  p.diets.filter((d) => d !== "none").map((d) => DIETS.find((x) => x.id === d)!.label.toLowerCase()).join(", ") || "no specific diet";

const fittingRecipes = (p: Profile | null, filter: (r: Recipe) => boolean) =>
  recipes.filter((r) => recipeFits(r, p) && filter(r));

const VITAMIN_GUIDE: Record<Goal, { name: string; why: string; foods: string }[]> = {
  "weight-loss": [
    { name: "Fibre", why: "helps you feel full for longer", foods: "vegetables, sauerkraut, legumes, oats" },
    { name: "Protein", why: "helps preserve muscle while eating less", foods: "eggs, skyr, lentils, tofu, fish" },
    { name: "Calcium", why: "important for bones when cutting back on food", foods: "dairy, fortified plant drinks, kale" },
    { name: "Vitamin C", why: "supports the immune system and iron absorption", foods: "peppers, citrus, cabbage" },
  ],
  "muscle-gain": [
    { name: "Protein", why: "the building block for muscle repair", foods: "chicken, skyr, tofu, lentils, eggs" },
    { name: "Magnesium", why: "contributes to normal muscle function", foods: "wholegrains, nuts, legumes" },
    { name: "Potassium", why: "supports normal muscle and nerve function", foods: "potatoes, bananas, vegetables" },
    { name: "Vitamin D & Calcium", why: "support bones and muscles", foods: "fatty fish, eggs, dairy (vitamin D also from sunlight)" },
  ],
  energy: [
    { name: "Iron", why: "helps transport oxygen in the body", foods: "lentils, wholegrains, meat — pair with vitamin C" },
    { name: "B vitamins", why: "contribute to normal energy metabolism", foods: "wholegrains, eggs, legumes, dairy" },
    { name: "Magnesium", why: "helps reduce tiredness and fatigue", foods: "oats, nuts, seeds, beans" },
    { name: "Complex carbs", why: "release energy steadily", foods: "oats, potatoes, brown rice" },
  ],
  balanced: [
    { name: "Vitamin C", why: "supports the immune system", foods: "peppers, berries, cabbage, red cabbage" },
    { name: "Folate", why: "contributes to normal cell division", foods: "leafy greens, beetroot, legumes" },
    { name: "Calcium", why: "keeps bones and teeth healthy", foods: "dairy, fortified plant drinks, greens" },
    { name: "Iron", why: "supports oxygen transport", foods: "legumes, wholegrains, meat" },
  ],
  digestive: [
    { name: "Fibre", why: "supports normal digestion", foods: "sauerkraut, red cabbage, oats, legumes" },
    { name: "Fluids", why: "help fibre do its job", foods: "water, herbal tea" },
    { name: "Fermented foods", why: "part of many traditional gut-friendly diets", foods: "sauerkraut, yoghurt, kefir" },
    { name: "Magnesium", why: "contributes to normal muscle function, incl. the gut", foods: "wholegrains, nuts" },
  ],
  wellness: [
    { name: "Vitamin D", why: "supports bones, muscles and immunity", foods: "sunlight, fatty fish, eggs" },
    { name: "Vitamin C", why: "supports the immune system", foods: "fruit, vegetables, cabbage" },
    { name: "Omega-3", why: "supports normal heart function", foods: "fatty fish, walnuts, linseed" },
    { name: "Fibre", why: "supports digestion and fullness", foods: "vegetables, wholegrains, legumes" },
  ],
};

export function demoReply(raw: string, profile: Profile | null, todayRecipeIds: string[] = []): AssistantReply {
  const t = raw.toLowerCase();
  const p = profile;
  const goal = p ? goalInfo(p.goal) : null;

  // ── Safety first: medical topics ───────────────────────────
  if (has(t, /deficien|supplement|pill|tablet|dosage|\bdose\b|diabet|pregnan|breastfeed|symptom|\bpain\b|disease|medication|eating disorder|anorex|bulim|blood (sugar|pressure)|cholesterol|kidney|ibs\b|crohn|celiac|coeliac/)) {
    return {
      text: [
        "That's an important question — and one where a **doctor or registered dietitian** is the right person to ask, because the answer depends on your health history and possibly a blood test.",
        "",
        "What I can do:",
        "- Explain which foods naturally contain specific vitamins and minerals",
        "- Suggest balanced meals that fit your profile",
        "- Help you plan food around advice from your doctor",
        "",
        "I can't diagnose deficiencies or tell you whether you need a supplement.",
        "",
        DISCLAIMER,
      ].join("\n"),
      suggestions: ["What vitamins and minerals are important for my goals?", "What should I eat today?"],
    };
  }

  // ── Greeting ───────────────────────────────────────────────
  if (has(t, /^(hi|hey|hello|hallo|good (morning|afternoon|evening))\b/) && t.length < 30) {
    return {
      text: `Hi${first(p)}! 👋 I'm your Smart Nutrition assistant. ${goal ? `I know your goal is **${goal.label.toLowerCase()}**, so I'll tailor my tips to that.` : ""} Ask me about meals, products, recipes or nutrients.`,
      suggestions: STARTER_QUESTIONS.slice(0, 4),
    };
  }

  // ── Vitamins & minerals ────────────────────────────────────
  if (has(t, /vitamin|mineral|nutrient|micronutr|iron|calcium|magnesium|zinc|b12|folate/)) {
    const g = p?.goal ?? "balanced";
    const list = VITAMIN_GUIDE[g];
    const vegan = p?.diets.includes("vegan");
    return {
      text: [
        `For your goal${goal ? ` (**${goal.label.toLowerCase()}**)` : ""}, these nutrients are worth keeping an eye on through everyday food:`,
        "",
        ...list.map((v) => `- **${v.name}** — ${v.why}. Found in ${v.foods}.`),
        ...(vegan
          ? ["", "As you eat vegan, **vitamin B12** is a nutrient to discuss with a doctor or dietitian, as it's found almost only in animal foods."]
          : []),
        "",
        "Cabbage-based foods such as sauerkraut and red cabbage naturally contain vitamin C and K (exact product values are still being verified).",
        "",
        "Whether you personally need more of anything is something only a doctor can tell — I won't recommend supplements.",
        "",
        DISCLAIMER,
      ].join("\n"),
      productIds: ["mildessa-sauerkraut", "red-cabbage-apple"].filter((id) => productFits(productById(id)!, p)),
      suggestions: ["Which foods are high in fibre?", "What should I eat today?"],
    };
  }

  // ── What should I eat today? ───────────────────────────────
  if (has(t, /eat today|today|meal plan|plan my|what (should|can) i eat|menu|suggest.*meal/)) {
    const ids = todayRecipeIds.length ? todayRecipeIds : ["overnight-oats", "sauerkraut-power-bowl", "red-cabbage-lentil-bowl", "gherkin-snack-plate"];
    const rs = ids.map((id) => recipeById(id)!).filter(Boolean);
    const kcal = rs.reduce((s, r) => s + r.kcal, 0);
    const protein = rs.reduce((s, r) => s + r.protein, 0);
    const fibre = rs.reduce((s, r) => s + r.fibre, 0);
    const targets = p ? computeTargets(p) : null;
    return {
      text: [
        `Here's a day that fits your profile${first(p)}${p ? ` — ${dietLabel(p)}, ${COOK_TIMES.find((c) => c.id === p.cookTime)!.label} to cook` : ""}:`,
        "",
        ...rs.map((r) => `- **${cap(r.slot)}:** ${r.name} · ${r.minutes} min · ${r.kcal} kcal`),
        "",
        `Together that's about **${kcal} kcal, ${protein} g protein and ${fibre} g fibre**${targets ? ` (your estimated target: ${targets.kcal} kcal, ${targets.protein} g protein, ${targets.fibre} g fibre)` : ""}.`,
        "",
        "Tap a recipe for ingredients and steps, or swap meals in your planner.",
      ].join("\n"),
      recipeIds: rs.map((r) => r.id),
      suggestions: ["What can I prepare in 10 minutes?", "Make it cheaper", "Which foods are high in fibre?"],
    };
  }

  // ── Weight loss ────────────────────────────────────────────
  if (has(t, /lose weight|weight loss|weight-loss|slim|low.?cal|fewer calories|diet product/)) {
    const prods = products.filter((x) => productFits(x, p) && x.tags.includes("low-calorie")).sort((a, b) => a.nutrition.energyKcal - b.nutrition.energyKcal).slice(0, 3);
    const rs = fittingRecipes(p, (r) => r.kcal <= 450).sort((a, b) => b.fibre + b.protein - (a.fibre + a.protein)).slice(0, 2);
    return {
      text: [
        "Great goal! The most sustainable approach is **filling, high-volume foods** that are low in calories but rich in fibre and protein.",
        "",
        "Hengstenberg products that fit well:",
        ...prods.map((x) => `- **${x.name}** — ${x.nutrition.energyKcal} kcal / 100 g. ${x.short}`),
        "",
        "Quick tips:",
        "- Fill half your plate with vegetables — sauerkraut counts!",
        "- Swap crisps for crunchy gherkins as a savoury snack",
        "- Include protein in every meal to stay full",
        "",
        "Aim for slow, steady progress rather than strict diets. " + DISCLAIMER,
      ].join("\n"),
      productIds: prods.map((x) => x.id),
      recipeIds: rs.map((r) => r.id),
      suggestions: ["What can I prepare in 10 minutes?", "How much protein do I need?"],
    };
  }

  // ── Fibre / digestion ──────────────────────────────────────
  if (has(t, /fib(re|er)|digest|gut|bloat|constipat/)) {
    const prods = products.filter((x) => productFits(x, p) && x.tags.includes("high-fibre"));
    const rs = fittingRecipes(p, (r) => r.fibre >= 10).sort((a, b) => b.fibre - a.fibre).slice(0, 2);
    return {
      text: [
        "Adults are generally advised to eat around **30 g of fibre per day** — most people get closer to 20 g. Great sources:",
        "",
        "- **Legumes:** lentils, chickpeas, beans (6–8 g / 100 g cooked)",
        "- **Wholegrains:** oats, rye bread, brown rice, quinoa",
        "- **Vegetables:** cabbage, sauerkraut, red cabbage, broccoli, carrots",
        "- **Nuts & seeds:** almonds, linseed, chia",
        "- **Fruit:** berries, apples and pears with skin",
        "",
        "Increase fibre gradually and drink enough water. Easy wins from Hengstenberg:",
      ].join("\n"),
      productIds: prods.map((x) => x.id),
      recipeIds: rs.map((r) => r.id),
      suggestions: ["Give me a high-fibre lunch", "What should I eat today?"],
    };
  }

  // ── Quick meals ────────────────────────────────────────────
  if (has(t, /10 ?min|ten minutes|quick|fast|busy|no time|in a hurry|5 ?min|easy/)) {
    const rs = fittingRecipes(p, (r) => r.minutes <= 10).sort((a, b) => a.minutes - b.minutes).slice(0, 4);
    return {
      text: [
        `Short on time${first(p)}? These are ready in **10 minutes or less** and fit your preferences:`,
        "",
        ...rs.map((r) => `- **${r.name}** — ${r.minutes} min · ${r.kcal} kcal · ≈ €${r.costEur.toFixed(2)}`),
        "",
        "Pro tip: jars like **Mildessa Mild Sauerkraut** and **KNAX Gherkins** are ready to eat — no cooking needed. Keep a few in the cupboard for busy weeks.",
      ].join("\n"),
      recipeIds: rs.map((r) => r.id),
      productIds: ["mildessa-sauerkraut", "knax-gherkins"].filter((id) => productFits(productById(id)!, p)),
      suggestions: ["Make it cheaper", "What should I eat today?"],
    };
  }

  // ── Diet fit ───────────────────────────────────────────────
  if (has(t, /fit my diet|my diet|which products|suitable|vegan|vegetarian|gluten|allerg|recommend/)) {
    const fits = recommendedProducts(p, 4);
    const excluded = p ? products.filter((x) => !productFits(x, p)) : [];
    return {
      text: [
        p ? `Based on your profile (**${dietLabel(p)}**${p.allergies.length ? `, avoiding ${p.allergies.join(", ")}` : ""}), these are my top picks for your goal:` : "Here are some popular picks:",
        "",
        ...fits.map((x) => `- **${x.name}** — ${x.highlights.join(" · ")}`),
        ...(excluded.length ? ["", `I've left out ${excluded.map((x) => x.name).join(", ")} because of your allergies or ingredients you avoid.`] : []),
        "",
        "Always double-check the label on the pack — product data in this prototype is sample data.",
      ].join("\n"),
      productIds: fits.map((x) => x.id),
      suggestions: ["Which foods are high in fibre?", "What can I prepare in 10 minutes?"],
    };
  }

  // ── Protein ────────────────────────────────────────────────
  if (has(t, /protein|muscle|gym|workout|training/)) {
    const target = p ? computeTargets(p).protein : null;
    const rs = fittingRecipes(p, (r) => r.protein >= 20).sort((a, b) => b.protein - a.protein).slice(0, 3);
    return {
      text: [
        target ? `Your estimated protein target is about **${target} g per day**, spread across your meals.` : "Most active adults do well with protein in every meal.",
        "",
        "Budget-friendly protein sources:",
        "- **Plant:** lentils, chickpeas, tofu, oats",
        "- **Dairy & eggs:** skyr, cottage cheese, eggs" + (p?.diets.includes("vegan") ? " (not for you — stick to plant sources)" : ""),
        "- **Fish & meat:** salmon, chicken breast" + (p?.diets.some((d) => d === "vegan" || d === "vegetarian") ? " (skip — you're plant-based)" : ""),
        "",
        "Combine them with veggies like sauerkraut or red cabbage for fibre and colour.",
        "",
        DISCLAIMER,
      ].join("\n"),
      recipeIds: rs.map((r) => r.id),
      suggestions: ["What should I eat today?", "What vitamins and minerals are important for my goals?"],
    };
  }

  // ── Budget ─────────────────────────────────────────────────
  if (has(t, /cheap|budget|money|afford|student|save|price|cheaper|discount|deal/)) {
    const rs = fittingRecipes(p, (r) => r.costEur <= 2).sort((a, b) => a.costEur - b.costEur).slice(0, 4);
    return {
      text: [
        `Eating well on a budget is totally doable${first(p)}. Meals under **€2 per portion**:`,
        "",
        ...rs.map((r) => `- **${r.name}** — ≈ €${r.costEur.toFixed(2)} · ${r.minutes} min`),
        "",
        "Money-saving tips:",
        "- Jars and pouches last long, so nothing goes to waste",
        "- Cook a double portion and take it for lunch",
        "- Lentils, oats and potatoes are cheap, filling staples",
        ...(p?.isStudent ? ["", "🎓 Check the **Student Corner** — the Student Starter Pack is 15% off (demo offer)."] : []),
      ].join("\n"),
      recipeIds: rs.map((r) => r.id),
      suggestions: ["What can I prepare in 10 minutes?", "Which Hengstenberg products fit my diet?"],
    };
  }

  // ── Hydration ──────────────────────────────────────────────
  if (has(t, /water|hydrat|drink|thirst/)) {
    const g = p ? computeTargets(p).waterGlasses : 8;
    return {
      text: [
        `A good daily orientation for you is about **${g} glasses (${(g * 0.25).toFixed(1)} L)** of fluids — more on hot days or when you exercise.`,
        "",
        "- Keep a bottle on your desk during lectures",
        "- Drink a glass with every meal",
        "- Herbal tea and sparkling water count too",
        "",
        "Track your glasses on the Home screen and turn on water reminders in your profile.",
      ].join("\n"),
      suggestions: ["What should I eat today?", "Which foods are high in fibre?"],
    };
  }

  // ── Energy ─────────────────────────────────────────────────
  if (has(t, /energy|tired|focus|concentrat|exam|study|sleepy/)) {
    const rs = fittingRecipes(p, (r) => r.fibre >= 7 && r.minutes <= 15).slice(0, 3);
    return {
      text: [
        "For steady energy through long study days:",
        "",
        "- **Don't skip breakfast** — oats or rye bread keep you going",
        "- **Combine carbs + protein + fibre** to avoid energy crashes",
        "- **Snack smart:** gherkins with hummus, fruit with nuts",
        "- **Drink enough water** — mild dehydration can make you feel tired",
        "",
        "If you feel tired all the time despite eating well and sleeping enough, please talk to a doctor.",
      ].join("\n"),
      recipeIds: rs.map((r) => r.id),
      suggestions: ["What vitamins and minerals are important for my goals?", "What can I prepare in 10 minutes?"],
    };
  }

  // ── Delivery ───────────────────────────────────────────────
  if (has(t, /deliver|order|shipping|track/)) {
    return {
      text: [
        "You can order any product straight from the app 🛒",
        "",
        "- **As soon as possible** or a **scheduled** time slot — day or night",
        "- Live order tracking from 'Order placed' to 'Delivered'",
        "- Free delivery from €20 (from €10 for verified students)",
        "",
        "_In this prototype, delivery is a demo: real 24/7 availability would depend on your location and partner stores._",
      ].join("\n"),
      suggestions: ["Which Hengstenberg products fit my diet?"],
    };
  }

  // ── Product specific ───────────────────────────────────────
  const prod = products.find((x) => {
    const key = x.name.toLowerCase();
    return t.includes(key) || (t.includes("sauerkraut") && x.id === "mildessa-sauerkraut") ||
      ((t.includes("gherkin") || t.includes("pickle") || t.includes("knax")) && x.id === "knax-gherkins") ||
      (t.includes("red cabbage") && x.id === "red-cabbage-apple") || (t.includes("beetroot") && x.id === "beetroot-slices") ||
      (t.includes("vinegar") && x.id === "apple-cider-vinegar") || (t.includes("onion") && x.id === "pearl-onions");
  });
  if (prod) {
    const fits = productFits(prod, p);
    return {
      text: [
        `**${prod.name}** — ${prod.short}`,
        "",
        `Per 100 g: ${prod.nutrition.energyKcal} kcal · ${prod.nutrition.fibre} g fibre · ${prod.nutrition.sugar} g sugar · ${prod.nutrition.salt} g salt (sample data).`,
        "",
        "Ways to enjoy it:",
        ...prod.usage.map((u) => `- ${u}`),
        ...(fits ? [] : ["", `⚠️ Heads-up: this product contains ${prod.allergens.join(", ")}, which is in your allergy list.`]),
      ].join("\n"),
      productIds: [prod.id],
      recipeIds: prod.recipeIds.filter((id) => recipeFits(recipeById(id)!, p)).slice(0, 2),
      suggestions: ["What can I prepare in 10 minutes?", "Which Hengstenberg products fit my diet?"],
    };
  }

  // ── Fallback ───────────────────────────────────────────────
  const budget = p ? BUDGETS.find((b) => b.id === p.budget)!.label.toLowerCase() : null;
  return {
    text: [
      `Good question${first(p)}! In this demo I'm best at meals, recipes, products and general nutrition${budget ? ` — always tailored to your goal and ${budget} budget` : ""}.`,
      "",
      "Try one of these:",
    ].join("\n"),
    suggestions: STARTER_QUESTIONS,
  };
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Find catalogue products mentioned by name in free text (used for AI answers). */
export function detectProducts(text: string): string[] {
  const t = text.toLowerCase();
  return products.filter((p) => t.includes(p.name.toLowerCase())).map((p) => p.id).slice(0, 4);
}

export function detectRecipes(text: string): string[] {
  const t = text.toLowerCase();
  return recipes.filter((r) => t.includes(r.name.toLowerCase())).map((r) => r.id).slice(0, 3);
}
