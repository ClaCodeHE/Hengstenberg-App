import { products } from "../data/products.ts";
import { recipes } from "../data/recipes.ts";
import { COOK_TIMES, BUDGETS } from "./nutrition.ts";
import type { MealSlot, Product, Profile, Recipe } from "./types.ts";

const strictDiet = (p: Profile) => p.diets.filter((d) => d === "vegan" || d === "vegetarian" || d === "gluten-free");

export function recipeFits(r: Recipe, p: Profile | null): boolean {
  if (!p) return true;
  for (const d of strictDiet(p)) {
    if (d === "gluten-free" ? r.allergens.includes("gluten") : !r.tags.includes(d)) return false;
  }
  if (r.allergens.some((a) => p.allergies.includes(a))) return false;
  const text = r.ingredients.join(" ").toLowerCase();
  if (p.avoid.some((w) => w.trim() && text.includes(w.trim().toLowerCase()))) return false;
  return true;
}

export function recipeScore(r: Recipe, p: Profile): number {
  let s = 0;
  const maxTime = COOK_TIMES.find((c) => c.id === p.cookTime)?.max ?? 20;
  if (r.minutes <= maxTime) s += 3;
  else s -= (r.minutes - maxTime) / 5;
  const perMeal = BUDGETS.find((b) => b.id === p.budget)?.perMeal ?? 4;
  if (r.costEur <= perMeal) s += 2;
  if (p.diets.includes("high-protein") || p.goal === "muscle-gain") s += r.protein / 12;
  if (p.diets.includes("low-calorie") || p.goal === "weight-loss") s += (600 - r.kcal) / 150;
  if (p.goal === "digestive") s += r.fibre / 5;
  if (p.goal === "energy") s += r.carbs / 40;
  if (r.productIds.length) s += 1.5;
  if (p.isStudent && r.student) s += 1;
  return s;
}

export function recipesFor(slot: MealSlot, p: Profile | null): Recipe[] {
  const pool = recipes.filter((r) => r.slot === slot);
  const fitting = pool.filter((r) => recipeFits(r, p));
  const list = fitting.length ? fitting : pool;
  if (!p) return list;
  return [...list].sort((a, b) => recipeScore(b, p) - recipeScore(a, p));
}

/** Deterministic default recipe for a day + slot, rotating through the best matches. */
export function defaultRecipeId(slot: MealSlot, p: Profile | null, dayIndex: number): string {
  const list = recipesFor(slot, p).slice(0, 3);
  return list[((dayIndex % list.length) + list.length) % list.length].id;
}

export function productFits(prod: Product, p: Profile | null): boolean {
  if (!p) return true;
  if (prod.allergens.some((a) => p.allergies.includes(a))) return false;
  if (p.diets.includes("vegan") && !prod.tags.includes("vegan")) return false;
  if (p.diets.includes("vegetarian") && !prod.tags.includes("vegetarian")) return false;
  if (p.diets.includes("gluten-free") && !prod.tags.includes("gluten-free")) return false;
  const text = prod.ingredients.toLowerCase();
  if (p.avoid.some((w) => w.trim() && text.includes(w.trim().toLowerCase()))) return false;
  return true;
}

export function productMatchesGoal(prod: Product, p: Profile | null) {
  return !!p && productFits(prod, p) && prod.goals.includes(p.goal);
}

export function recommendedProducts(p: Profile | null, limit = 6): Product[] {
  if (!p) return products.slice(0, limit);
  const score = (prod: Product) =>
    (prod.goals.includes(p.goal) ? 5 : 0) +
    (p.diets.includes("low-calorie") && prod.tags.includes("low-calorie") ? 2 : 0) +
    (p.goal === "digestive" && prod.tags.includes("high-fibre") ? 2 : 0) +
    (p.budget === "low" && prod.price < 2 ? 1 : 0) +
    prod.rating / 5;
  return products
    .filter((prod) => productFits(prod, p))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

export function whyRecommended(prod: Product, p: Profile | null): string {
  if (!p) return prod.highlights[0];
  if (p.goal === "weight-loss" && prod.tags.includes("low-calorie")) return `Only ${prod.nutrition.energyKcal} kcal / 100 g`;
  if (p.goal === "digestive" && prod.tags.includes("high-fibre")) return "Fibre for your gut-health goal";
  if (p.goal === "energy") return "Colourful veg for steady energy";
  if (p.cookTime === "under-10" || p.cookTime === "10-20") return "Ready in minutes";
  return prod.highlights[0];
}
