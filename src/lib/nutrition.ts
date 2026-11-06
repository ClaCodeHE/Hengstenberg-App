import type { Activity, Allergen, CookTime, Budget, Diet, Gender, Goal, MealSlot, Profile } from "./types.ts";

export const GOALS: { id: Goal; label: string; short: string; emoji: string; blurb: string }[] = [
  { id: "weight-loss", label: "Weight loss", short: "Lose weight", emoji: "🥗", blurb: "Lighter meals that keep you full" },
  { id: "muscle-gain", label: "Muscle gain", short: "Build muscle", emoji: "💪", blurb: "More protein, steady energy" },
  { id: "energy", label: "More energy", short: "More energy", emoji: "⚡", blurb: "Fuel for busy days" },
  { id: "balanced", label: "Balanced diet", short: "Healthy lifestyle", emoji: "⚖️", blurb: "A bit of everything, done well" },
  { id: "digestive", label: "Digestive health", short: "Gut health", emoji: "🌿", blurb: "Fibre-rich, gentle foods" },
  { id: "wellness", label: "General wellness", short: "Feel good", emoji: "☀️", blurb: "Simple habits that last" },
];

export const DIETS: { id: Diet; label: string }[] = [
  { id: "none", label: "No preference" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "high-protein", label: "High protein" },
  { id: "low-calorie", label: "Low calorie" },
  { id: "gluten-free", label: "Gluten-free" },
];

export const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: "gluten", label: "Gluten" },
  { id: "dairy", label: "Milk / Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "nuts", label: "Nuts" },
  { id: "soy", label: "Soy" },
  { id: "fish", label: "Fish" },
  { id: "mustard", label: "Mustard" },
  { id: "celery", label: "Celery" },
  { id: "sesame", label: "Sesame" },
  { id: "sulphites", label: "Sulphites" },
];

export const ACTIVITY: { id: Activity; label: string; hint: string }[] = [
  { id: "low", label: "Low", hint: "Mostly sitting" },
  { id: "moderate", label: "Moderate", hint: "Active 2–3× / week" },
  { id: "high", label: "High", hint: "Active most days" },
];

export const GENDERS: { id: Gender; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "diverse", label: "Diverse" },
  { id: "unspecified", label: "Prefer not to say" },
];

export const COOK_TIMES: { id: CookTime; label: string; max: number }[] = [
  { id: "under-10", label: "< 10 min", max: 10 },
  { id: "10-20", label: "10–20 min", max: 20 },
  { id: "20-40", label: "20–40 min", max: 40 },
  { id: "40-plus", label: "40+ min", max: 120 },
];

export const BUDGETS: { id: Budget; label: string; hint: string; perMeal: number }[] = [
  { id: "low", label: "Low", hint: "≈ €2 per meal", perMeal: 2.5 },
  { id: "medium", label: "Medium", hint: "≈ €4 per meal", perMeal: 4.5 },
  { id: "high", label: "Flexible", hint: "Quality first", perMeal: 99 },
];

export const SLOTS: { id: MealSlot; label: string; time: string }[] = [
  { id: "breakfast", label: "Breakfast", time: "08:00" },
  { id: "lunch", label: "Lunch", time: "12:30" },
  { id: "dinner", label: "Dinner", time: "19:00" },
  { id: "snack", label: "Snack", time: "16:00" },
];

export const goalInfo = (g: Goal) => GOALS.find((x) => x.id === g)!;

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  waterGlasses: number; // 250 ml glasses
}

/**
 * Estimated daily targets (Mifflin-St Jeor + simple activity factor).
 * These are general estimates for orientation only — not medical or dietetic advice.
 */
export function computeTargets(p: Profile): Targets {
  const s = p.gender === "male" ? 5 : p.gender === "female" ? -161 : -78;
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + s;
  const factor = p.activity === "low" ? 1.4 : p.activity === "moderate" ? 1.6 : 1.8;
  let kcal = bmr * factor;
  if (p.goal === "weight-loss" || p.diets.includes("low-calorie")) kcal *= 0.85;
  if (p.goal === "muscle-gain") kcal *= 1.1;
  kcal = Math.max(1400, Math.round(kcal / 50) * 50);

  let proteinPerKg = 1.0;
  if (p.goal === "weight-loss") proteinPerKg = 1.3;
  if (p.goal === "muscle-gain" || p.diets.includes("high-protein")) proteinPerKg = 1.6;
  const protein = Math.round(p.weightKg * proteinPerKg);
  const fat = Math.round((kcal * 0.3) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const waterMl = Math.min(3000, Math.max(1500, p.weightKg * 35));
  const waterGlasses = Math.round(waterMl / 250);
  return { kcal, protein, carbs, fat, fibre: 30, waterGlasses };
}

export function bmi(p: Profile) {
  const h = p.heightCm / 100;
  return p.weightKg / (h * h);
}

export const DEMO_PROFILE: Profile = {
  name: "Emma",
  occupation: "University student",
  goal: "balanced",
  age: 22,
  gender: "female",
  heightCm: 168,
  weightKg: 60,
  activity: "moderate",
  diets: ["none"],
  allergies: [],
  avoid: [],
  cookTime: "10-20",
  budget: "low",
  mealsPerDay: 4,
  isStudent: true,
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  occupation: "",
  goal: "balanced",
  age: 25,
  gender: "unspecified",
  heightCm: 170,
  weightKg: 65,
  activity: "moderate",
  diets: ["none"],
  allergies: [],
  avoid: [],
  cookTime: "10-20",
  budget: "medium",
  mealsPerDay: 3,
  isStudent: false,
};
