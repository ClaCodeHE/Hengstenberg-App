import { useState } from "react";
import { Flame, Trophy, Droplet, Leaf, Utensils, Target } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { ProgressBar, ProgressRing, SectionHeader, TopBar, cx } from "../components/ui.tsx";
import { computeTargets, goalInfo } from "../lib/nutrition.ts";
import { addDays, dayKey, weekdayShort } from "../lib/dates.ts";
import { slotsFor, useDay } from "../lib/useToday.ts";
import { recipeById } from "../data/recipes.ts";

export function Progress() {
  const profile = useApp((s) => s.profile);
  const plan = useApp((s) => s.plan);
  const waterLog = useApp((s) => s.water);
  const navigate = useApp((s) => s.navigate);
  const today = dayKey();
  const { entries, eaten, doneCount } = useDay(today);
  const [hover, setHover] = useState<number | null>(null);
  if (!profile) return null;
  const t = computeTargets(profile);
  const slots = slotsFor(profile.mealsPerDay);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6);
    const k = dayKey(d);
    const day = plan[k] ?? {};
    const done = slots.filter((s) => day[s]?.done).length;
    const productMeals = slots.filter((s) => day[s]?.done && ((recipeById(day[s]!.recipeId)?.productIds.length ?? 0) > 0 || (day[s]?.extras.length ?? 0) > 0)).length;
    return { d, k, done, water: waterLog[k] ?? 0, productMeals };
  });
  const totalDone = week.reduce((s, x) => s + x.done, 0);
  const consistency = Math.round((totalDone / (7 * slots.length)) * 100);
  let streak = 0;
  for (let i = week.length - 1; i >= 0; i--) {
    if (week[i].done >= Math.min(3, slots.length)) streak++;
    else if (i !== week.length - 1) break;
  }
  const hengstenbergMeals = week.reduce((s, x) => s + x.productMeals, 0);
  const waterDaysHit = week.filter((x) => x.water >= t.waterGlasses).length;
  const goal = goalInfo(profile.goal);

  const goals = [
    { I: Utensils, l: `Complete ${slots.length} meals today`, v: doneCount, m: slots.length },
    { I: Droplet, l: `Drink ${t.waterGlasses} glasses of water`, v: waterLog[today] ?? 0, m: t.waterGlasses },
    { I: Leaf, l: `Reach ${t.fibre} g fibre today`, v: Math.round(eaten.fibre), m: t.fibre },
    { I: Target, l: "Enjoy 5 meals with Hengstenberg veg this week", v: Math.min(5, hengstenbergMeals), m: 5 },
  ];

  return (
    <div>
      <TopBar title="Progress & goals" />
      <div className="space-y-6 px-5">
        <section className="flex items-center gap-4 rounded-[28px] bg-forest p-5 text-white shadow-lift">
          <ProgressRing value={doneCount} max={entries.length} size={110} stroke={11} label={`${doneCount} of ${entries.length} meals completed today`}>
            <div>
              <p className="text-[26px] font-extrabold leading-none">{doneCount}/{entries.length}</p>
              <p className="mt-1 text-[10.5px] text-white/60">meals today</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-white/60">Your goal</p>
            <p className="font-display text-[20px] font-semibold leading-tight">{goal.emoji} {goal.label}</p>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-bold"><Flame size={13} className="text-[#FFB14A]" /> {streak}-day streak</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-bold"><Trophy size={13} className="text-fresh" /> {consistency}%</span>
            </div>
          </div>
        </section>

        {/* weekly consistency */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-[18px] font-semibold text-forest">Weekly consistency</h2>
              <p className="text-[12px] text-ink-3">Meals completed per day · last 7 days</p>
            </div>
            <p className="text-[22px] font-extrabold text-forest tabular-nums">{consistency}%</p>
          </div>
          <div className="relative mt-4 flex h-[140px] items-end gap-2.5" role="img" aria-label={`Meals completed: ${week.map((w) => `${weekdayShort(w.d)} ${w.done}`).join(", ")}`}>
            {[...Array(slots.length + 1)].map((_, i) => (
              <span key={i} className="pointer-events-none absolute inset-x-0 border-t border-line/70" style={{ bottom: `${(i / slots.length) * 100}%` }} />
            ))}
            {week.map((w, i) => (
              <button
                key={w.k}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setHover(hover === i ? null : i)}
                aria-label={`${weekdayShort(w.d)}: ${w.done} of ${slots.length} meals`}
                className="relative flex h-full flex-1 items-end justify-center"
              >
                {hover === i && (
                  <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-forest px-2 py-1 text-[11px] font-semibold text-white shadow-lift">
                    {w.done}/{slots.length} meals · {w.water} 💧
                  </span>
                )}
                <span
                  className={cx("w-full max-w-[26px] rounded-t-[4px] transition-all duration-700", w.k === today ? "bg-forest" : "bg-fresh", hover !== null && hover !== i && "opacity-50")}
                  style={{ height: `${Math.max(3, (w.done / slots.length) * 100)}%` }}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2.5">
            {week.map((w) => (
              <span key={w.k} className={cx("flex-1 text-center text-[11px] font-semibold", w.k === today ? "text-forest" : "text-ink-3")}>{w.k === today ? "Today" : weekdayShort(w.d)}</span>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-3">Water goal reached on {waterDaysHit} of 7 days.</p>
        </section>

        {/* personal goals */}
        <section>
          <SectionHeader title="Personal goals" action="Edit goal" onAction={() => navigate("onboarding", { edit: "1" })} />
          <div className="space-y-2.5">
            {goals.map(({ I, l, v, m }) => {
              const done = v >= m;
              return (
                <div key={l} className="flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-soft">
                  <span className={cx("grid size-10 shrink-0 place-items-center rounded-2xl", done ? "bg-fresh text-white" : "bg-sage text-forest")}><I size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{l}</p>
                      <p className="shrink-0 text-[12px] font-bold text-forest tabular-nums">{v}/{m}</p>
                    </div>
                    <ProgressBar value={v} max={m} className="mt-1.5" label={l} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* nutrition overview */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <h2 className="font-display text-[18px] font-semibold text-forest">Nutrition overview · today</h2>
          <p className="mb-3 text-[12px] text-ink-3">From completed meals, compared with your estimated targets.</p>
          <div className="space-y-3">
            {[
              { l: "Energy", v: eaten.kcal, m: t.kcal, u: "kcal" },
              { l: "Protein", v: eaten.protein, m: t.protein, u: "g" },
              { l: "Carbohydrates", v: eaten.carbs, m: t.carbs, u: "g" },
              { l: "Fat", v: eaten.fat, m: t.fat, u: "g" },
              { l: "Fibre", v: eaten.fibre, m: t.fibre, u: "g" },
            ].map((x) => (
              <div key={x.l}>
                <div className="mb-1 flex justify-between text-[12.5px]">
                  <span className="font-semibold text-ink">{x.l}</span>
                  <span className="text-ink-3 tabular-nums">{Math.round(x.v)} / {x.m} {x.u}</span>
                </div>
                <ProgressBar value={x.v} max={x.m} label={`${x.l} progress`} color={x.v > x.m * 1.1 ? "bg-[#E0A21F]" : "bg-fresh"} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-3">General estimates for orientation — not medical advice.</p>
        </section>
      </div>
    </div>
  );
}
