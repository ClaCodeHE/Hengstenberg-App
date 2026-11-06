import { useState } from "react";
import { Check, Heart, RefreshCw, Plus, X, Zap } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { DemoNote, ProgressBar, SectionHeader, Sheet, TopBar, cx } from "../components/ui.tsx";
import { MealArt } from "../components/MealArt.tsx";
import { RecipeMeta, RecipeRow } from "../components/cards.tsx";
import { ProductArt } from "../components/ProductArt.tsx";
import { computeTargets, SLOTS } from "../lib/nutrition.ts";
import { dayKey, weekDays, weekdayShort, formatDate } from "../lib/dates.ts";
import { useDay } from "../lib/useToday.ts";
import { recipesFor, recipeFits, productFits } from "../lib/recommend.ts";
import { recipes } from "../data/recipes.ts";
import { productById, products } from "../data/products.ts";
import type { MealSlot } from "../lib/types.ts";

export function Planner() {
  const profile = useApp((s) => s.profile);
  const [view, setView] = useState<"day" | "week">("day");
  const [selected, setSelected] = useState(dayKey());
  const days = weekDays();

  return (
    <div>
      <TopBar
        title="Meal planner"
        right={
          <div className="flex rounded-full bg-sage p-1" role="tablist" aria-label="Planner view">
            {(["day", "week"] as const).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx("rounded-full px-3 py-1.5 text-[12px] font-bold capitalize", view === v ? "bg-white text-forest shadow-sm" : "text-ink-3")}>
                {v}
              </button>
            ))}
          </div>
        }
      />
      <div className="px-5">
        <DayStrip days={days} selected={selected} onSelect={(k) => { setSelected(k); setView("day"); }} />
        {view === "day" ? <DayView key={selected} dayKeyStr={selected} /> : <WeekView days={days} onOpen={(k) => { setSelected(k); setView("day"); }} />}
        {profile && <QuickRecipes />}
      </div>
    </div>
  );
}

function DayStrip({ days, selected, onSelect }: { days: Date[]; selected: string; onSelect: (k: string) => void }) {
  const plan = useApp((s) => s.plan);
  const today = dayKey();
  return (
    <div className="mb-4 flex gap-1.5">
      {days.map((d) => {
        const k = dayKey(d);
        const on = k === selected;
        const done = Object.values(plan[k] ?? {}).filter((e) => e?.done).length;
        return (
          <button key={k} onClick={() => onSelect(k)} aria-pressed={on} className={cx("flex min-w-0 flex-1 flex-col items-center rounded-2xl py-2.5 transition", on ? "bg-forest text-white shadow-lift" : "bg-white text-ink shadow-soft")}>
            <span className={cx("text-[11px] font-semibold", on ? "text-white/70" : "text-ink-3")}>{k === today ? "Today" : weekdayShort(d)}</span>
            <span className="text-[17px] font-bold">{d.getDate()}</span>
            <span className="mt-1 flex gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cx("size-1 rounded-full", i < done ? "bg-fresh" : on ? "bg-white/25" : "bg-sage-200")} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DayView({ dayKeyStr }: { dayKeyStr: string }) {
  const profile = useApp((s) => s.profile);
  const toggleDone = useApp((s) => s.toggleDone);
  const setMeal = useApp((s) => s.setMeal);
  const addExtra = useApp((s) => s.addExtra);
  const removeExtra = useApp((s) => s.removeExtra);
  const favs = useApp((s) => s.favorites.recipes);
  const toggleFav = useApp((s) => s.toggleFavRecipe);
  const navigate = useApp((s) => s.navigate);
  const toast = useApp((s) => s.showToast);
  const { entries, planned, eaten, doneCount } = useDay(dayKeyStr);
  const [swapSlot, setSwapSlot] = useState<MealSlot | null>(null);
  const [productSlot, setProductSlot] = useState<MealSlot | null>(null);
  const t = profile ? computeTargets(profile) : null;
  const [y, m, d] = dayKeyStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const alternatives = swapSlot
    ? [...recipesFor(swapSlot, profile)].sort((a, b) => Number(favs.includes(b.id)) - Number(favs.includes(a.id)))
    : [];

  return (
    <>
      <p className="mb-2 text-[13px] font-semibold text-ink-3">{formatDate(date)}</p>
      {/* totals */}
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-soft">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-3">Estimated daily total</p>
            <p className="text-[26px] font-extrabold text-forest tabular-nums">
              {Math.round(planned.kcal)} <span className="text-[13px] font-semibold text-ink-3">{t ? `/ ${t.kcal} kcal` : "kcal"}</span>
            </p>
          </div>
          <span className="rounded-full bg-fresh-100 px-3 py-1.5 text-[12px] font-bold text-forest">{doneCount}/{entries.length} done</span>
        </div>
        <ProgressBar value={eaten.kcal} max={t?.kcal ?? planned.kcal} className="mt-2" label="Calories eaten" />
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Protein", v: planned.protein, tt: t?.protein },
            { l: "Carbs", v: planned.carbs, tt: t?.carbs },
            { l: "Fat", v: planned.fat, tt: t?.fat },
            { l: "Fibre", v: planned.fibre, tt: t?.fibre },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl bg-cream py-2">
              <p className="text-[14px] font-extrabold text-forest tabular-nums">{Math.round(x.v)}g</p>
              <p className="text-[10px] font-medium text-ink-3">{x.l}{x.tt ? ` / ${x.tt}` : ""}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {entries.map((e) => {
          const slot = SLOTS.find((s) => s.id === e.slot)!;
          const fav = favs.includes(e.recipeId);
          return (
            <article key={e.slot} className={cx("rounded-3xl bg-white p-3 shadow-soft transition", e.done && "ring-2 ring-fresh/60")}>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-fresh-600">{slot.label} · {slot.time}</p>
                {e.done && <span className="text-[11px] font-bold text-forest">Completed ✓</span>}
              </div>
              <button onClick={() => navigate("recipe", { id: e.recipeId })} className="flex w-full items-center gap-3 text-left">
                <MealArt colors={e.recipe.colors} seed={e.recipe.id} className="size-[72px] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-tight text-ink">{e.recipe.name}</p>
                  <RecipeMeta r={e.recipe} className="mt-1" />
                  <p className="mt-1 text-[11px] text-ink-3">{e.recipe.protein} g protein · {e.recipe.fibre} g fibre</p>
                </div>
              </button>
              {e.extras.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {e.extras.map((id) => {
                    const p = productById(id);
                    if (!p) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-fresh-100 py-1 pl-1 pr-1.5 text-[11.5px] font-semibold text-forest">
                        <span className="grid size-5 place-items-center overflow-hidden rounded-full" style={{ background: p.art.bg }}>
                          <ProductArt art={p.art} seed={p.id} showBg={false} className="size-6" />
                        </span>
                        {p.name}
                        <button aria-label={`Remove ${p.name}`} onClick={() => removeExtra(dayKeyStr, e.slot, id)} className="grid size-4 place-items-center rounded-full hover:bg-forest/10"><X size={11} /></button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <button onClick={() => toggleDone(dayKeyStr, e.slot)} aria-pressed={e.done} className={cx("flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-semibold transition", e.done ? "bg-fresh text-white" : "bg-sage text-forest")}>
                  <Check size={16} strokeWidth={3} /> {e.done ? "Done" : "Mark done"}
                </button>
                <button onClick={() => setSwapSlot(e.slot)} className="flex flex-col items-center gap-1 rounded-2xl bg-sage py-2 text-[10.5px] font-semibold text-forest">
                  <RefreshCw size={16} /> Replace
                </button>
                <button onClick={() => toggleFav(e.recipeId)} aria-pressed={fav} className="flex flex-col items-center gap-1 rounded-2xl bg-sage py-2 text-[10.5px] font-semibold text-forest">
                  <Heart size={16} className={fav ? "fill-berry text-berry" : ""} /> {fav ? "Saved" : "Favourite"}
                </button>
                <button onClick={() => setProductSlot(e.slot)} className="flex flex-col items-center gap-1 rounded-2xl bg-sage py-2 text-[10.5px] font-semibold text-forest">
                  <Plus size={16} /> Product
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <DemoNote className="mt-3">Nutrition totals are estimates per portion based on sample data.</DemoNote>

      <Sheet open={!!swapSlot} onClose={() => setSwapSlot(null)} title={`Replace ${swapSlot ?? ""}`}>
        <p className="-mt-2 mb-3 text-[12.5px] text-ink-3">Matched to your diet, allergies, time and budget.</p>
        <div className="space-y-2">
          {alternatives.map((r) => {
            const current = entries.find((e) => e.slot === swapSlot)?.recipeId === r.id;
            return (
              <RecipeRow
                key={r.id}
                recipe={r}
                onClick={() => {
                  setMeal(dayKeyStr, swapSlot!, r.id);
                  setSwapSlot(null);
                  toast(`${r.name} added to your plan`);
                }}
                right={current ? <span className="mr-1 text-[11px] font-bold text-fresh-600">Current</span> : favs.includes(r.id) ? <Heart size={15} className="mr-1 fill-berry text-berry" /> : undefined}
              />
            );
          })}
        </div>
      </Sheet>

      <Sheet open={!!productSlot} onClose={() => setProductSlot(null)} title="Add a Hengstenberg product">
        <div className="grid grid-cols-2 gap-2.5">
          {products.filter((p) => productFits(p, profile)).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                addExtra(dayKeyStr, productSlot!, p.id);
                setProductSlot(null);
                toast(`${p.name} added to ${productSlot}`);
              }}
              className="flex items-center gap-2 rounded-2xl bg-white p-2 text-left shadow-soft"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: p.art.bg }}>
                <ProductArt art={p.art} seed={p.id} showBg={false} className="size-12" />
              </span>
              <span className="text-[12px] font-semibold leading-tight text-ink">{p.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

function WeekView({ days, onOpen }: { days: Date[]; onOpen: (k: string) => void }) {
  return (
    <div className="space-y-2.5">
      {days.map((d) => <WeekRow key={dayKey(d)} date={d} onOpen={onOpen} />)}
    </div>
  );
}

function WeekRow({ date, onOpen }: { date: Date; onOpen: (k: string) => void }) {
  const k = dayKey(date);
  const { entries, planned, doneCount } = useDay(k);
  return (
    <button onClick={() => onOpen(k)} className="flex w-full items-center gap-3 rounded-3xl bg-white p-3 text-left shadow-soft">
      <div className="w-12 text-center">
        <p className="text-[11px] font-semibold text-ink-3">{weekdayShort(date)}</p>
        <p className="text-[19px] font-bold text-forest">{date.getDate()}</p>
      </div>
      <div className="flex flex-1 -space-x-2">
        {entries.map((e) => (
          <MealArt key={e.slot} colors={e.recipe.colors} seed={e.recipe.id} className={cx("size-11 rounded-full ring-2 ring-white", e.done && "opacity-50")} />
        ))}
      </div>
      <div className="text-right">
        <p className="text-[13px] font-bold text-ink tabular-nums">{Math.round(planned.kcal)} kcal</p>
        <p className="text-[11px] text-ink-3">{doneCount}/{entries.length} done</p>
      </div>
    </button>
  );
}

function QuickRecipes() {
  const profile = useApp((s) => s.profile);
  const quick = recipes.filter((r) => r.minutes <= 10 && recipeFits(r, profile)).slice(0, 5);
  return (
    <section className="mt-8">
      <SectionHeader title="Quick recipes for busy days" />
      <p className="-mt-2 mb-3 flex items-center gap-1.5 text-[12.5px] text-ink-3"><Zap size={13} /> Ready in 10 minutes or less</p>
      <div className="space-y-2.5">
        {quick.map((r) => <RecipeRow key={r.id} recipe={r} />)}
      </div>
    </section>
  );
}
