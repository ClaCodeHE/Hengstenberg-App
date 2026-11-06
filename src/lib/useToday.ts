import { useApp } from "../store/useApp.ts";
import { recipeById } from "../data/recipes.ts";
import { productById } from "../data/products.ts";
import { SLOTS } from "./nutrition.ts";
import type { MealSlot } from "./types.ts";

export function slotsFor(mealsPerDay: number | undefined): MealSlot[] {
  const all = SLOTS.map((s) => s.id);
  return (mealsPerDay ?? 4) >= 4 ? all : all.filter((s) => s !== "snack");
}

/** Resolved plan for a day plus nutrition totals of completed meals. */
export function useDay(key: string) {
  const profile = useApp((s) => s.profile);
  useApp((s) => s.plan[key]); // subscribe to changes of this day
  const getEntry = useApp((s) => s.getEntry);
  const slots = slotsFor(profile?.mealsPerDay);
  const entries = slots.map((slot) => {
    const e = getEntry(key, slot);
    return { slot, ...e, recipe: recipeById(e.recipeId)! };
  });
  const sum = (filter: (e: (typeof entries)[number]) => boolean) =>
    entries.filter(filter).reduce(
      (t, e) => {
        const extra = e.extras.map((id) => productById(id)!).filter(Boolean);
        const ex = (k: "energyKcal" | "protein" | "carbs" | "fat" | "fibre") => extra.reduce((s, p) => s + (p.nutrition[k] * p.servingG) / 100, 0);
        return {
          kcal: t.kcal + e.recipe.kcal + ex("energyKcal"),
          protein: t.protein + e.recipe.protein + ex("protein"),
          carbs: t.carbs + e.recipe.carbs + ex("carbs"),
          fat: t.fat + e.recipe.fat + ex("fat"),
          fibre: t.fibre + e.recipe.fibre + ex("fibre"),
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
    );
  return {
    entries,
    eaten: sum((e) => e.done),
    planned: sum(() => true),
    doneCount: entries.filter((e) => e.done).length,
  };
}
