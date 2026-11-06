import { ChevronRight, Pencil, LineChart, CalendarDays, Bell, Package, Heart, GraduationCap, RotateCcw, UserRound, ShieldCheck, Server } from "lucide-react";
import { useState } from "react";
import { useApp } from "../store/useApp.ts";
import { Button, CartButton, SectionHeader, Tag } from "../components/ui.tsx";
import { ProductTile, RecipeRow } from "../components/cards.tsx";
import { ACTIVITY, ALLERGENS, BUDGETS, COOK_TIMES, DIETS, computeTargets, goalInfo } from "../lib/nutrition.ts";
import { productById } from "../data/products.ts";
import { recipeById } from "../data/recipes.ts";
import { assistantMode } from "../services/assistantService.ts";

export function ProfileScreen() {
  const s = useApp();
  const p = s.profile;
  const [confirmReset, setConfirmReset] = useState(false);

  if (!p) {
    return (
      <div className="px-5 pt-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage text-forest"><UserRound size={28} /></span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-forest">Create your profile</h1>
        <p className="mt-1 text-sm text-ink-2">Get personalised meals, products and targets.</p>
        <Button className="mt-6" onClick={() => s.navigate("onboarding")}>Get Started</Button>
        <button onClick={s.loadDemo} className="mt-3 block w-full text-[13px] font-semibold text-forest-600">Use demo profile (Emma)</button>
      </div>
    );
  }

  const t = computeTargets(p);
  const goal = goalInfo(p.goal);
  const rows: [string, string][] = [
    ["Goal", `${goal.emoji} ${goal.label}`],
    ["Age · Height · Weight", `${p.age} yrs · ${p.heightCm} cm · ${p.weightKg} kg`],
    ["Activity level", ACTIVITY.find((a) => a.id === p.activity)!.label],
    ["Diet", p.diets.map((d) => DIETS.find((x) => x.id === d)!.label).join(", ")],
    ["Allergies", p.allergies.length ? p.allergies.map((a) => ALLERGENS.find((x) => x.id === a)!.label).join(", ") : "None"],
    ["Avoiding", p.avoid.length ? p.avoid.join(", ") : "—"],
    ["Time to cook", COOK_TIMES.find((c) => c.id === p.cookTime)!.label],
    ["Budget", BUDGETS.find((b) => b.id === p.budget)!.label],
    ["Meals per day", String(p.mealsPerDay)],
    ["Student", p.isStudent ? (s.student.verified ? "Yes · verified ✓" : "Yes · not verified") : "No"],
  ];
  const links = [
    { l: "Progress & goals", I: LineChart, on: () => s.navigate("progress") },
    { l: "Meal planner", I: CalendarDays, on: () => s.navigate("planner") },
    { l: "Smart reminders", I: Bell, on: () => s.navigate("reminders"), hint: s.remindersOn ? "On" : "Off" },
    { l: "My orders", I: Package, on: () => s.navigate("orders"), hint: s.orders.length ? String(s.orders.length) : undefined },
    { l: "Student Corner", I: GraduationCap, on: () => s.tab("student") },
  ];

  return (
    <div>
      <header className="flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))]">
        <h1 className="font-display text-[26px] font-semibold text-forest">Profile</h1>
        <CartButton />
      </header>

      <div className="space-y-7 px-5 pt-4">
        <section className="relative overflow-hidden rounded-[28px] bg-forest p-5 text-white shadow-lift">
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-fresh/20 blur-xl" />
          <div className="relative flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-full bg-fresh font-display text-[28px] font-semibold text-forest">{p.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[22px] font-semibold leading-tight">{p.name}</p>
              <p className="text-[12.5px] text-white/65">{[p.age && `${p.age} years`, p.occupation].filter(Boolean).join(" · ")}</p>
              <Tag tone="fresh" className="mt-1.5">{goal.emoji} {goal.label}</Tag>
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { v: t.kcal, u: "kcal / day" },
              { v: `${t.protein} g`, u: "protein" },
              { v: `${(t.waterGlasses * 0.25).toFixed(1)} L`, u: "water" },
            ].map((x) => (
              <div key={x.u} className="rounded-2xl bg-white/10 py-2.5">
                <p className="text-[16px] font-extrabold tabular-nums">{x.v}</p>
                <p className="text-[10.5px] text-white/60">{x.u}</p>
              </div>
            ))}
          </div>
          <p className="relative mt-2 text-[10.5px] text-white/45">Estimates for orientation only, not medical advice.</p>
        </section>

        <section>
          <SectionHeader title="Nutrition profile" action="Edit" onAction={() => s.navigate("onboarding", { edit: "1" })} />
          <div className="divide-y divide-line rounded-3xl bg-white px-4 shadow-soft">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 py-3">
                <span className="text-[12.5px] font-medium text-ink-3">{k}</span>
                <span className="text-right text-[13px] font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" full className="mt-3" icon={<Pencil size={15} />} onClick={() => s.navigate("onboarding", { edit: "1" })}>
            Edit profile
          </Button>
        </section>

        <section className="divide-y divide-line rounded-3xl bg-white px-2 shadow-soft">
          {links.map(({ l, I, on, hint }) => (
            <button key={l} onClick={on} className="flex w-full items-center gap-3 px-2 py-3.5 text-left">
              <span className="grid size-9 place-items-center rounded-xl bg-sage text-forest"><I size={17} /></span>
              <span className="flex-1 text-[14px] font-semibold text-ink">{l}</span>
              {hint && <span className="text-[12px] font-semibold text-ink-3">{hint}</span>}
              <ChevronRight size={17} className="text-ink-3" />
            </button>
          ))}
        </section>

        {(s.favorites.products.length > 0 || s.favorites.recipes.length > 0) && (
          <section>
            <SectionHeader title="Favourites" />
            {s.favorites.products.length > 0 && (
              <div className="no-scrollbar -mx-5 mb-3 flex gap-3 overflow-x-auto px-5 pb-1">
                {s.favorites.products.map((id) => productById(id)).filter(Boolean).map((x) => <ProductTile key={x!.id} product={x!} />)}
              </div>
            )}
            <div className="space-y-2">
              {s.favorites.recipes.map((id) => recipeById(id)).filter(Boolean).map((r) => (
                <RecipeRow key={r!.id} recipe={r!} right={<Heart size={16} className="mr-1 fill-berry text-berry" />} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
          <p className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-2">
            <ShieldCheck size={16} className="mt-px shrink-0 text-forest" />
            Your profile is stored only in this browser for the prototype. Accounts and cloud sync can be connected later.
          </p>
          <p className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-2">
            <Server size={16} className="mt-px shrink-0 text-forest" />
            AI assistant: {assistantMode() === true ? "connected to the secure server-side AI." : "runs in demo mode until a server-side AI key is configured."}
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="sm" className="flex-1" icon={<UserRound size={14} />} onClick={s.loadDemo}>Load demo (Emma)</Button>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              icon={<RotateCcw size={14} />}
              onClick={() => {
                if (confirmReset) s.resetAll();
                else {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 4000);
                }
              }}
            >
              {confirmReset ? "Tap again to reset" : "Reset app"}
            </Button>
          </div>
        </section>
        <p className="pb-2 text-center text-[11px] text-ink-3">Hengstenberg Smart Nutrition · University innovation prototype v1.0</p>
      </div>
    </div>
  );
}
