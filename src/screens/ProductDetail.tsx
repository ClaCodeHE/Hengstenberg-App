import { useState } from "react";
import { Heart, Star, Check, CalendarPlus, AlertTriangle, Leaf, Utensils } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, CartButton, DemoNote, QtyStepper, Sheet, Tag, TopBar, cx } from "../components/ui.tsx";
import { ProductArt } from "../components/ProductArt.tsx";
import { RecipeRow, TAG_LABEL, useAddToCart, ProductTile } from "../components/cards.tsx";
import { productById, products } from "../data/products.ts";
import { recipeById } from "../data/recipes.ts";
import { ALLERGENS, SLOTS } from "../lib/nutrition.ts";
import { productFits, productMatchesGoal } from "../lib/recommend.ts";
import { addDays, dayKey, euro, weekdayShort } from "../lib/dates.ts";
import type { MealSlot } from "../lib/types.ts";

const TABS = ["Overview", "Nutrition", "Ingredients", "Usage"] as const;

export function ProductDetail({ id }: { id: string }) {
  const p = productById(id);
  const profile = useApp((s) => s.profile);
  const fav = useApp((s) => s.favorites.products.includes(id));
  const toggleFav = useApp((s) => s.toggleFavProduct);
  const addExtra = useApp((s) => s.addExtra);
  const toast = useApp((s) => s.showToast);
  const addToCart = useAddToCart();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [qty, setQty] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);
  const [planDay, setPlanDay] = useState(0);
  const [planSlot, setPlanSlot] = useState<MealSlot>("lunch");

  if (!p) return <TopBar title="Product not found" />;
  const fits = productFits(p, profile);
  const goalMatch = productMatchesGoal(p, profile);
  const n = p.nutrition;
  const perServing = (v: number) => ((v * p.servingG) / 100).toFixed(1);
  const related = products.filter((x) => x.id !== p.id && x.category === p.category).concat(products.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 4);

  const openPlan = () => (profile ? setPlanOpen(true) : toast("Create your profile to use the meal planner"));
  const addToPlan = () => {
    const key = dayKey(addDays(new Date(), planDay));
    addExtra(key, planSlot, p.id);
    setPlanOpen(false);
    toast(`Added to ${planDay === 0 ? "today's" : weekdayShort(addDays(new Date(), planDay)) + "'s"} ${planSlot}`, { label: "Planner", route: { name: "planner" } });
  };

  return (
    <div className="min-h-full">
      <div style={{ background: `linear-gradient(180deg, ${p.art.bg} 0%, ${p.art.bg} 70%, #FAF8F2 100%)` }}>
        <TopBar
          transparent
          right={
            <>
              <button aria-label={fav ? "Remove from favourites" : "Save to favourites"} aria-pressed={fav} onClick={() => toggleFav(p.id)} className="grid size-10 place-items-center rounded-full bg-white shadow-soft">
                <Heart size={18} className={fav ? "fill-berry text-berry" : "text-forest"} />
              </button>
              <CartButton />
            </>
          }
        />
        <div className="relative mx-auto -mt-2 grid h-[260px] place-items-center">
          <ProductArt art={p.art} seed={p.id} className="size-[260px] animate-pop" title={p.name} />
          {goalMatch && (
            <span className="absolute bottom-4 left-5 inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-[11.5px] font-bold text-white shadow-lift">
              <Leaf size={13} className="text-fresh" /> Fits your goal
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-fresh-600">{p.brand} · {p.category}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-display text-[27px] font-semibold leading-tight text-forest">{p.name}</h1>
          <div className="text-right">
            <p className="text-[22px] font-extrabold text-forest tabular-nums">{euro(p.price)}</p>
            <p className="text-[10.5px] text-ink-3">{p.size}</p>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-3">
          <span className="inline-flex items-center gap-1 font-semibold text-ink-2"><Star size={13} className="fill-[#F2B705] text-[#F2B705]" /> {p.rating}</span>
          <span>·</span>
          <span>Sample price &amp; data</span>
        </div>

        {!fits && profile && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-berry-100 p-3 text-[12.5px] text-berry">
            <AlertTriangle size={16} className="mt-px shrink-0" />
            <span>Contains {p.allergens.map((a) => ALLERGENS.find((x) => x.id === a)!.label).join(", ")} — on your allergy list or an ingredient you avoid.</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { l: "Energy", v: `${n.energyKcal}`, u: "kcal" },
            { l: "Fibre", v: `${n.fibre}`, u: "g" },
            { l: "Sugar", v: `${n.sugar}`, u: "g" },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl bg-white px-3 py-2.5 text-center shadow-soft">
              <p className="text-[17px] font-extrabold text-forest tabular-nums">{x.v}<span className="ml-0.5 text-[11px] font-semibold text-ink-3">{x.u}</span></p>
              <p className="text-[10.5px] font-medium text-ink-3">{x.l} / 100 g</p>
            </div>
          ))}
        </div>

        <Button variant="outline" full className="mt-3" icon={<CalendarPlus size={16} />} onClick={openPlan}>
          Add to My Meal Plan
        </Button>

        {/* tabs */}
        <div role="tablist" aria-label="Product information" className="mt-5 grid grid-cols-4 rounded-2xl bg-sage p-1">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("rounded-xl py-2 text-[12.5px] font-semibold transition", tab === t ? "bg-white text-forest shadow-soft" : "text-ink-2")}>
              {t}
            </button>
          ))}
        </div>

        <div key={tab} role="tabpanel" className="mt-4 animate-[fade-up_.3s_both]">
          {tab === "Overview" && (
            <div className="space-y-4">
              <p className="text-[14px] leading-relaxed text-ink-2">{p.description}</p>
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="mb-2.5 text-[14px] font-bold text-ink">Key benefits</h3>
                <ul className="space-y-2">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[13px] leading-snug text-ink-2">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-fresh-100 text-forest"><Check size={12} strokeWidth={3} /></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-[14px] font-bold text-ink">Suitable for</h3>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => <Tag key={t} tone="fresh">{TAG_LABEL[t]}</Tag>)}
                </div>
              </div>
            </div>
          )}

          {tab === "Nutrition" && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-forest text-left text-white">
                      <th className="px-4 py-2.5 font-semibold">Nutrition</th>
                      <th className="px-2 py-2.5 text-right font-semibold">per 100 g</th>
                      <th className="px-4 py-2.5 text-right font-semibold">per {p.servingG} g</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line tabular-nums">
                    {[
                      ["Energy", `${n.energyKj} kJ / ${n.energyKcal} kcal`, `${Math.round((n.energyKcal * p.servingG) / 100)} kcal`],
                      ["Fat", `${n.fat} g`, `${perServing(n.fat)} g`],
                      ["– of which saturates", `${n.saturatedFat} g`, `${perServing(n.saturatedFat)} g`, true],
                      ["Carbohydrate", `${n.carbs} g`, `${perServing(n.carbs)} g`],
                      ["– of which sugars", `${n.sugar} g`, `${perServing(n.sugar)} g`, true],
                      ["Fibre", `${n.fibre} g`, `${perServing(n.fibre)} g`],
                      ["Protein", `${n.protein} g`, `${perServing(n.protein)} g`],
                      ["Salt", `${n.salt} g`, `${perServing(n.salt)} g`],
                    ].map(([l, a, b, sub]) => (
                      <tr key={l as string}>
                        <td className={cx("px-4 py-2.5", sub ? "pl-6 text-ink-3" : "font-semibold text-ink")}>{l}</td>
                        <td className="px-2 py-2.5 text-right text-ink-2">{a}</td>
                        <td className="px-4 py-2.5 text-right text-ink-2">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="text-[14px] font-bold text-ink">Vitamins &amp; minerals</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{p.vitamins}</p>
              </div>
              <DemoNote>Sample nutrition data for the prototype. Verified values from the product label will replace these figures.</DemoNote>
            </div>
          )}

          {tab === "Ingredients" && (
            <div className="space-y-3">
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="text-[14px] font-bold text-ink">Ingredients</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{p.ingredients}</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="text-[14px] font-bold text-ink">Allergens</h3>
                {p.allergens.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.allergens.map((a) => (
                      <Tag key={a} tone={profile?.allergies.includes(a) ? "berry" : "cream"}>Contains {ALLERGENS.find((x) => x.id === a)!.label.toLowerCase()}</Tag>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[13px] text-ink-2">No allergens declared (sample data).</p>
                )}
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="mb-2 text-[14px] font-bold text-ink">Dietary suitability</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["vegan", "vegetarian", "gluten-free", "low-fat"] as const).map((t) => {
                    const ok = p.tags.includes(t);
                    return (
                      <div key={t} className={cx("flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-semibold", ok ? "bg-fresh-100 text-forest" : "bg-cream-200 text-ink-3")}>
                        {ok ? <Check size={14} strokeWidth={3} /> : <span className="w-3.5 text-center">–</span>}
                        {TAG_LABEL[t]}
                      </div>
                    );
                  })}
                </div>
              </div>
              <DemoNote>Always check the label on the pack. Ingredients shown are sample data.</DemoNote>
            </div>
          )}

          {tab === "Usage" && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-ink"><Utensils size={15} /> How to enjoy it</h3>
                <ol className="space-y-2">
                  {p.usage.map((u, i) => (
                    <li key={u} className="flex gap-3 text-[13px] text-ink-2">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest text-[10.5px] font-bold text-white">{i + 1}</span>
                      {u}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="mb-2 text-[14px] font-bold text-ink">Great combinations</h3>
                <div className="flex flex-wrap gap-1.5">
                  {p.pairings.map((x) => <Tag key={x} tone="cream" className="py-1.5 text-[12px]">+ {x}</Tag>)}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-[14px] font-bold text-ink">Recipe ideas</h3>
                <div className="space-y-2">
                  {p.recipeIds.map((rid) => recipeById(rid)).filter(Boolean).map((r) => <RecipeRow key={r!.id} recipe={r!} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        <h2 className="mb-3 mt-8 font-display text-[19px] font-semibold text-forest">You might also like</h2>
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
          {related.map((r) => <ProductTile key={r.id} product={r} />)}
        </div>
      </div>

      {/* sticky actions */}
      <div className="sticky bottom-0 z-30 border-t border-line/70 bg-cream/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <QtyStepper small qty={qty} onChange={(q) => setQty(Math.max(1, q))} />
          <button
            onClick={openPlan}
            aria-label="Add to My Meal Plan"
            title="Add to My Meal Plan"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-sage text-forest transition active:scale-95 hover:bg-sage-200"
          >
            <CalendarPlus size={18} />
          </button>
          <Button className="flex-1 whitespace-nowrap px-3" onClick={() => { addToCart(p, qty); setQty(1); }}>
            Add to Cart · {euro(p.price * qty)}
          </Button>
        </div>
      </div>

      <Sheet open={planOpen} onClose={() => setPlanOpen(false)} title="Add to My Meal Plan">
        <p className="mb-2 text-[12.5px] font-semibold text-ink-3">Day</p>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(new Date(), i);
            return (
              <button key={i} onClick={() => setPlanDay(i)} className={cx("flex w-14 shrink-0 flex-col items-center rounded-2xl py-2.5", planDay === i ? "bg-forest text-white" : "bg-white text-ink shadow-soft")}>
                <span className="text-[11px] font-semibold opacity-70">{i === 0 ? "Today" : weekdayShort(d)}</span>
                <span className="text-[17px] font-bold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-2 mt-4 text-[12.5px] font-semibold text-ink-3">Meal</p>
        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((s) => (
            <button key={s.id} onClick={() => setPlanSlot(s.id)} className={cx("rounded-2xl py-3 text-[14px] font-semibold", planSlot === s.id ? "bg-forest text-white" : "bg-white text-ink shadow-soft")}>
              {s.label}
            </button>
          ))}
        </div>
        <Button full size="lg" className="mt-5" onClick={addToPlan}>
          <CalendarPlus size={18} /> Add {p.name}
        </Button>
      </Sheet>
    </div>
  );
}
