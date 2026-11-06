import { Bell, Check, ChevronRight, Droplet, Minus, Plus, Sparkles, Truck, CalendarDays, Store, GraduationCap, LineChart, Package, Target, Clock } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { CartButton, ProgressBar, ProgressRing, SectionHeader, cx } from "../components/ui.tsx";
import { ProductTile, RecipeMeta } from "../components/cards.tsx";
import { MealArt } from "../components/MealArt.tsx";
import { computeTargets, goalInfo, SLOTS } from "../lib/nutrition.ts";
import { dayKey, formatDate, formatTime, greeting } from "../lib/dates.ts";
import { recommendedProducts, whyRecommended } from "../lib/recommend.ts";
import { useDay } from "../lib/useToday.ts";
import { orderStep, ORDER_STEPS, etaDate } from "../lib/orders.ts";
import { REMINDER_COPY } from "../lib/useReminders.ts";
import { useEffect, useState } from "react";
import { STARTER_QUESTIONS } from "../lib/assistant.ts";

export function Home() {
  const profile = useApp((s) => s.profile);
  const navigate = useApp((s) => s.navigate);
  const tab = useApp((s) => s.tab);
  const toggleDone = useApp((s) => s.toggleDone);
  const water = useApp((s) => s.water[dayKey()] ?? 0);
  const setWater = useApp((s) => s.setWater);
  const orders = useApp((s) => s.orders);
  const reminders = useApp((s) => s.reminders);
  const remindersOn = useApp((s) => s.remindersOn);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const today = dayKey();
  const { entries, eaten, doneCount } = useDay(today);
  if (!profile) return null;
  const t = computeTargets(profile);
  const goal = goalInfo(profile.goal);
  const recs = recommendedProducts(profile, 6);
  const activeOrder = orders.find((o) => orderStep(o) < 3);
  const nextMeal = entries.find((e) => !e.done);

  return (
    <div>
      {/* header */}
      <section className="relative overflow-hidden rounded-b-[36px] bg-forest px-5 pb-6 pt-[max(18px,env(safe-area-inset-top))] text-white">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-fresh/15 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-white/60">{formatDate(new Date())}</p>
            <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight">
              {greeting()}, {profile.name}! 👋
            </h1>
          </div>
          <div className="flex gap-2">
            <button aria-label="Reminders" onClick={() => navigate("reminders")} className="relative grid size-10 place-items-center rounded-full bg-white/15 hover:bg-white/25">
              <Bell size={18} />
              {remindersOn && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-berry ring-2 ring-forest" />}
            </button>
            <CartButton light />
          </div>
        </div>
        <button onClick={() => navigate("onboarding", { edit: "1" })} className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 py-1.5 pl-2 pr-3 text-[12px] font-semibold ring-1 ring-white/15 hover:bg-white/20">
          <Target size={13} className="text-fresh" /> Goal: {goal.short} {goal.emoji}
        </button>

        <div className="relative mt-5 flex items-center gap-5 rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10">
          <ProgressRing value={eaten.kcal} max={t.kcal} size={118} stroke={11} label={`${Math.round(eaten.kcal)} of ${t.kcal} kilocalories eaten`}>
            <div>
              <p className="text-[24px] font-extrabold leading-none tabular-nums">{Math.round(eaten.kcal)}</p>
              <p className="mt-1 text-[10.5px] font-medium text-white/60">of {t.kcal} kcal</p>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-2.5">
            {[
              { l: "Protein", v: eaten.protein, m: t.protein },
              { l: "Carbs", v: eaten.carbs, m: t.carbs },
              { l: "Fat", v: eaten.fat, m: t.fat },
              { l: "Fibre", v: eaten.fibre, m: t.fibre },
            ].map((x) => (
              <div key={x.l}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-semibold text-white/85">{x.l}</span>
                  <span className="text-white/60 tabular-nums">{Math.round(x.v)} / {x.m} g</span>
                </div>
                <ProgressBar value={x.v} max={x.m} className="h-1.5 bg-white/12" color="bg-fresh" label={`${x.l} progress`} />
              </div>
            ))}
          </div>
        </div>
        <p className="relative mt-2 text-center text-[10.5px] text-white/45">Estimated targets for orientation — not medical advice.</p>
      </section>

      <div className="space-y-7 px-5 pt-6 stagger">
        {/* active order */}
        {activeOrder && (
          <button onClick={() => navigate("order", { id: activeOrder.id })} className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-left shadow-soft ring-2 ring-fresh/60">
            <span className="grid size-11 place-items-center rounded-2xl bg-fresh-100 text-forest"><Package size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-ink">Order {activeOrder.id} · {ORDER_STEPS[orderStep(activeOrder)].label}</p>
              <p className="text-[12px] text-ink-3">{activeOrder.delivery === "asap" ? `Estimated arrival ${formatTime(etaDate(activeOrder))}` : `Scheduled: ${activeOrder.slotLabel}`}</p>
            </div>
            <span className="rounded-full bg-forest px-3 py-1.5 text-[11.5px] font-bold text-white">Track</span>
          </button>
        )}

        {/* AI CTA */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-fresh to-[#a9d46f] p-5 shadow-soft">
          <div className="absolute -bottom-10 -right-6 size-36 rounded-full bg-white/25" />
          <div className="relative flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest text-fresh"><Sparkles size={20} /></span>
            <div>
              <h2 className="font-display text-[19px] font-semibold leading-tight text-forest">Ask Your AI Nutrition Assistant</h2>
              <p className="mt-1 text-[12.5px] text-forest/75">Personal answers based on your goal, diet and schedule.</p>
            </div>
          </div>
          <div className="no-scrollbar relative -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
            {STARTER_QUESTIONS.slice(0, 4).map((q) => (
              <button key={q} onClick={() => navigate("assistant", { q })} className="shrink-0 rounded-full bg-white/80 px-3.5 py-2 text-[12px] font-semibold text-forest hover:bg-white">
                {q}
              </button>
            ))}
          </div>
          <button onClick={() => tab("assistant")} className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3 text-[14px] font-semibold text-white hover:bg-forest-700">
            <Sparkles size={16} /> Ask Your AI Nutrition Assistant
          </button>
        </section>

        {/* meal progress */}
        <section>
          <SectionHeader title="Today's meals" action="Meal planner" onAction={() => navigate("planner")} />
          <div className="mb-3 flex gap-1.5" aria-label={`${doneCount} of ${entries.length} meals completed`}>
            {entries.map((e) => (
              <button key={e.slot} onClick={() => toggleDone(today, e.slot)} className="flex-1 text-center" aria-label={`Mark ${e.slot} ${e.done ? "not done" : "done"}`}>
                <div className={cx("h-2 rounded-full transition-colors", e.done ? "bg-fresh" : "bg-sage-200")} />
                <span className={cx("mt-1.5 block text-[10.5px] font-semibold", e.done ? "text-forest" : "text-ink-3")}>{SLOTS.find((s) => s.id === e.slot)!.label}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2.5">
            {entries.map((e) => (
              <div key={e.slot} className={cx("flex items-center gap-3 rounded-3xl bg-white p-2.5 pr-3 shadow-soft transition", e.done && "bg-white/70")}>
                <button onClick={() => navigate("recipe", { id: e.recipeId })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <MealArt colors={e.recipe.colors} seed={e.recipe.id} className="size-16 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-fresh-600">{SLOTS.find((s) => s.id === e.slot)!.label}</p>
                    <p className={cx("truncate text-[14px] font-bold text-ink", e.done && "text-ink-3 line-through decoration-fresh decoration-2")}>{e.recipe.name}</p>
                    <RecipeMeta r={e.recipe} className="mt-0.5" />
                  </div>
                </button>
                <button
                  onClick={() => toggleDone(today, e.slot)}
                  aria-label={e.done ? `Mark ${e.slot} as not eaten` : `Mark ${e.slot} as eaten`}
                  aria-pressed={e.done}
                  className={cx("grid size-10 shrink-0 place-items-center rounded-full transition active:scale-90", e.done ? "bg-fresh text-white" : "bg-sage text-forest/40 hover:text-forest")}
                >
                  <Check size={18} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
          {nextMeal && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-3">
              <Clock size={12} /> Up next: {nextMeal.recipe.name} · ready in {nextMeal.recipe.minutes} min
            </p>
          )}
        </section>

        {/* water */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[18px] font-semibold text-forest">Water intake</h2>
              <p className="text-[12px] text-ink-3">
                <span className="font-bold text-forest tabular-nums">{water}</span> of {t.waterGlasses} glasses · {(water * 0.25).toFixed(2).replace(/0$/, "")} L
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Remove a glass" onClick={() => setWater(today, water - 1)} className="grid size-9 place-items-center rounded-full bg-sage text-forest active:scale-90"><Minus size={16} /></button>
              <button aria-label="Add a glass of water" onClick={() => setWater(today, water + 1)} className="grid size-9 place-items-center rounded-full bg-[#3B8FD9] text-white active:scale-90"><Plus size={16} /></button>
            </div>
          </div>
          <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(t.waterGlasses, water)}, minmax(0, 1fr))` }}>
            {Array.from({ length: Math.max(t.waterGlasses, water) }, (_, i) => (
              <button
                key={i}
                onClick={() => setWater(today, i + 1 === water ? i : i + 1)}
                aria-label={`Set water to ${i + 1} glasses`}
                className={cx("grid h-10 w-full max-w-9 place-items-center justify-self-center rounded-b-xl rounded-t-md border-2 transition", i < water ? "border-[#3B8FD9] bg-[#DCEEFC] text-[#3B8FD9]" : "border-sage-200 text-sage-200")}
              >
                <Droplet size={14} className={i < water ? "fill-current" : ""} />
              </button>
            ))}
          </div>
        </section>

        {/* recommendations */}
        <section>
          <SectionHeader title="Recommended for you" action="See all" onAction={() => navigate("products", { filter: "goal" })} />
          <p className="-mt-2 mb-3 text-[12.5px] text-ink-3">Hengstenberg picks for your goal: {goal.label.toLowerCase()}</p>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {recs.map((p) => (
              <ProductTile key={p.id} product={p} reason={whyRecommended(p, profile)} />
            ))}
          </div>
        </section>

        {/* delivery banner */}
        <button onClick={() => tab("products")} className="relative flex w-full items-center gap-4 overflow-hidden rounded-[28px] bg-forest p-5 text-left text-white shadow-lift">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-berry/30 blur-xl" />
          <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10"><Truck size={26} className="text-fresh" /></span>
          <div className="relative flex-1">
            <span className="inline-block rounded-full bg-berry px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">24/7 Delivery</span>
            <p className="mt-1.5 font-display text-[18px] font-semibold leading-tight">Order anytime, day or night</p>
            <p className="text-[12px] text-white/65">As soon as possible or at a time that suits you.</p>
          </div>
          <ChevronRight className="relative text-white/60" />
        </button>

        {/* quick actions */}
        <section>
          <SectionHeader title="Quick access" />
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { l: "Shop", I: Store, on: () => tab("products") },
              { l: "Planner", I: CalendarDays, on: () => navigate("planner") },
              { l: "Student", I: GraduationCap, on: () => tab("student") },
              { l: "Progress", I: LineChart, on: () => navigate("progress") },
            ].map(({ l, I, on }) => (
              <button key={l} onClick={on} className="flex flex-col items-center gap-2 rounded-3xl bg-white py-3.5 shadow-soft transition active:scale-95">
                <span className="grid size-10 place-items-center rounded-2xl bg-sage text-forest"><I size={19} /></span>
                <span className="text-[11.5px] font-semibold text-ink-2">{l}</span>
              </button>
            ))}
          </div>
        </section>

        {/* reminders */}
        <section>
          <SectionHeader title="Today's reminders" action="Manage" onAction={() => navigate("reminders")} />
          {remindersOn ? (
            <div className="divide-y divide-line rounded-3xl bg-white px-4 shadow-soft">
              {reminders.filter((r) => r.enabled).map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <span className="text-xl">{REMINDER_COPY[r.id].emoji}</span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{REMINDER_COPY[r.id].title}</p>
                    <p className="text-[11.5px] text-ink-3">{r.days}</p>
                  </div>
                  <span className="rounded-full bg-sage px-2.5 py-1 text-[12px] font-bold text-forest tabular-nums">{r.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={() => navigate("reminders")} className="w-full rounded-3xl bg-white p-4 text-left text-[13px] text-ink-3 shadow-soft">
              Reminders are off. Tap to set them up.
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
