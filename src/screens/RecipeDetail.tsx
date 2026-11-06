import { useState } from "react";
import { Heart, Clock, Flame, Wallet, CalendarPlus, ShoppingBag, Check } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, Tag, TopBar, cx, DemoNote } from "../components/ui.tsx";
import { MealArt } from "../components/MealArt.tsx";
import { ProductTile } from "../components/cards.tsx";
import { recipeById } from "../data/recipes.ts";
import { productById } from "../data/products.ts";
import { DIETS, ALLERGENS } from "../lib/nutrition.ts";
import { dayKey, euro } from "../lib/dates.ts";
import { recipeFits } from "../lib/recommend.ts";

export function RecipeDetail({ id }: { id: string }) {
  const r = recipeById(id);
  const profile = useApp((s) => s.profile);
  const fav = useApp((s) => s.favorites.recipes.includes(id));
  const toggleFav = useApp((s) => s.toggleFavRecipe);
  const setMeal = useApp((s) => s.setMeal);
  const addToCart = useApp((s) => s.addToCart);
  const toast = useApp((s) => s.showToast);
  const [checked, setChecked] = useState<number[]>([]);
  if (!r) return <TopBar title="Recipe not found" />;
  const prods = r.productIds.map((pid) => productById(pid)!).filter(Boolean);
  const fits = recipeFits(r, profile);

  return (
    <div className="pb-8">
      <div className="bg-sage pb-6">
        <TopBar
          transparent
          right={
            <button aria-label={fav ? "Remove from favourites" : "Save recipe"} aria-pressed={fav} onClick={() => toggleFav(r.id)} className="grid size-10 place-items-center rounded-full bg-white shadow-soft">
              <Heart size={18} className={fav ? "fill-berry text-berry" : "text-forest"} />
            </button>
          }
        />
        <MealArt colors={r.colors} seed={r.id} className="mx-auto size-[220px] animate-pop" />
      </div>
      <div className="-mt-5 rounded-t-[32px] bg-cream px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-fresh-600">{r.slot}</p>
        <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight text-forest">{r.name}</h1>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { I: Clock, v: `${r.minutes} min` },
            { I: Flame, v: `${r.kcal} kcal` },
            { I: Wallet, v: `≈ ${euro(r.costEur)}` },
          ].map(({ I, v }) => (
            <div key={v} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-2.5 text-[13px] font-bold text-forest shadow-soft">
              <I size={15} className="text-fresh-600" /> {v}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.tags.map((t) => <Tag key={t} tone="fresh">{DIETS.find((d) => d.id === t)!.label}</Tag>)}
          {r.allergens.map((a) => <Tag key={a} tone={profile?.allergies.includes(a) ? "berry" : "cream"}>Contains {ALLERGENS.find((x) => x.id === a)!.label.toLowerCase()}</Tag>)}
        </div>
        {!fits && profile && <p className="mt-2 text-[12.5px] font-medium text-berry">Heads-up: this recipe doesn't match all of your preferences.</p>}

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[["Protein", r.protein], ["Carbs", r.carbs], ["Fat", r.fat], ["Fibre", r.fibre]].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-white py-2 shadow-soft">
              <p className="text-[15px] font-extrabold text-forest">{v}g</p>
              <p className="text-[10.5px] text-ink-3">{l}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-2 mt-6 font-display text-[19px] font-semibold text-forest">Ingredients</h2>
        <ul className="rounded-3xl bg-white p-2 shadow-soft">
          {r.ingredients.map((ing, i) => {
            const on = checked.includes(i);
            return (
              <li key={ing}>
                <button onClick={() => setChecked(on ? checked.filter((x) => x !== i) : [...checked, i])} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left text-[13.5px]">
                  <span className={cx("grid size-5 shrink-0 place-items-center rounded-md border-2", on ? "border-fresh bg-fresh text-white" : "border-sage-200")}>{on && <Check size={12} strokeWidth={3} />}</span>
                  <span className={cx(on ? "text-ink-3 line-through" : "text-ink")}>{ing}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <h2 className="mb-2 mt-6 font-display text-[19px] font-semibold text-forest">Instructions</h2>
        <ol className="space-y-2.5">
          {r.steps.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-3xl bg-white p-3.5 text-[13.5px] leading-relaxed text-ink-2 shadow-soft">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest text-[12px] font-bold text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        {prods.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 font-display text-[19px] font-semibold text-forest">Hengstenberg products used</h2>
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {prods.map((p) => <ProductTile key={p.id} product={p} />)}
            </div>
          </>
        )}

        <div className="mt-6 grid gap-2.5">
          {profile && (
            <Button size="lg" icon={<CalendarPlus size={18} />} onClick={() => { setMeal(dayKey(), r.slot, r.id); toast(`Set as today's ${r.slot}`, { label: "Planner", route: { name: "planner" } }); }}>
              Add to today's plan
            </Button>
          )}
          {prods.length > 0 && (
            <Button size="lg" variant="outline" icon={<ShoppingBag size={18} />} onClick={() => { prods.forEach((p) => addToCart(p.id)); toast(`${prods.length} product${prods.length > 1 ? "s" : ""} added to cart`, { label: "View cart", route: { name: "cart" } }); }}>
              Shop ingredients · {euro(prods.reduce((s, p) => s + p.price, 0))}
            </Button>
          )}
        </div>
        <DemoNote className="mt-4">Nutrition per portion is an estimate.</DemoNote>
      </div>
    </div>
  );
}
