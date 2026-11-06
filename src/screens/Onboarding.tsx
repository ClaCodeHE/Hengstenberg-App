import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, Sparkles, Loader2 } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, Chip, IconButton, cx } from "../components/ui.tsx";
import { ACTIVITY, ALLERGENS, BUDGETS, COOK_TIMES, DIETS, EMPTY_PROFILE, GENDERS, GOALS } from "../lib/nutrition.ts";
import type { Diet, Profile } from "../lib/types.ts";

const STEPS = ["Your goal", "About you", "Food preferences", "Lifestyle"];

export function Onboarding({ edit = false }: { edit?: boolean }) {
  const existing = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const tab = useApp((s) => s.tab);
  const back = useApp((s) => s.back);
  const toast = useApp((s) => s.showToast);
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(edit && existing ? existing : EMPTY_PROFILE);
  const [finishing, setFinishing] = useState(false);
  const up = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  const valid = [
    true,
    p.name.trim().length > 0 && p.age >= 14 && p.age <= 100 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 35 && p.weightKg <= 250,
    p.diets.length > 0,
    true,
  ][step];

  const finish = () => {
    const final: Profile = { ...p, name: p.name.trim(), occupation: p.isStudent ? p.occupation || "University student" : p.occupation === "University student" ? "" : p.occupation };
    setProfile(final);
    if (edit) {
      toast("Profile saved");
      back();
      return;
    }
    setFinishing(true);
  };

  if (finishing) return <Finishing name={p.name} onDone={() => tab("home")} />;

  return (
    <div className="flex min-h-[100dvh] flex-col lg:min-h-[calc(min(880px,100dvh-4rem)-38px)]">
      <header className="sticky top-0 z-20 bg-cream/95 px-5 pb-4 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <IconButton label={step === 0 ? "Close" : "Previous step"} onClick={() => (step === 0 ? back() : setStep(step - 1))}>
            {step === 0 ? <X size={18} /> : <ArrowLeft size={18} />}
          </IconButton>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
              {edit ? "Edit profile · " : ""}Step {step + 1} of {STEPS.length}
            </p>
            <p className="font-display text-[17px] font-semibold text-forest">{STEPS[step]}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4} aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => (edit || i < step) && setStep(i)} aria-label={`Go to ${s}`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage-200">
              <span className={cx("block h-full rounded-full bg-fresh transition-all duration-500", i <= step ? "w-full" : "w-0")} />
            </button>
          ))}
        </div>
      </header>

      <div key={step} className="flex-1 px-5 pb-6 animate-[fade-up_.35s_both]">
        {step === 0 && <StepGoal p={p} up={up} />}
        {step === 1 && <StepAbout p={p} up={up} />}
        {step === 2 && <StepDiet p={p} up={up} />}
        {step === 3 && <StepLifestyle p={p} up={up} />}
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line/70 bg-cream/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="flex gap-3">
          {edit && (
            <Button variant="secondary" size="lg" onClick={finish} disabled={!valid} className="flex-1">
              Save
            </Button>
          )}
          <Button size="lg" className="flex-[2]" disabled={!valid} onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}>
            {step < STEPS.length - 1 ? (
              <>Continue <ArrowRight size={18} /></>
            ) : edit ? (
              <>Save changes <Check size={18} /></>
            ) : (
              <>Create my plan <Sparkles size={18} /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

type StepProps = { p: Profile; up: (x: Partial<Profile>) => void };

function Q({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 mt-6 first:mt-2">
      <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      {hint && <p className="text-[12.5px] text-ink-3">{hint}</p>}
    </div>
  );
}

function StepGoal({ p, up }: StepProps) {
  return (
    <>
      <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight text-forest">What would you like to achieve?</h1>
      <p className="mt-1 text-sm text-ink-2">We'll personalise meals and products around your goal.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 @lg:grid-cols-3">
        {GOALS.map((g) => {
          const on = p.goal === g.id;
          return (
            <button
              key={g.id}
              onClick={() => up({ goal: g.id })}
              aria-pressed={on}
              className={cx(
                "relative flex flex-col items-start gap-2 rounded-3xl p-4 text-left transition active:scale-[0.97]",
                on ? "bg-forest text-white shadow-lift" : "bg-white text-ink shadow-soft hover:ring-2 hover:ring-fresh/50",
              )}
            >
              <span className={cx("grid size-11 place-items-center rounded-2xl text-2xl", on ? "bg-white/15" : "bg-sage")}>{g.emoji}</span>
              <span className="text-[15px] font-bold leading-tight">{g.label}</span>
              <span className={cx("text-[12px] leading-snug", on ? "text-white/75" : "text-ink-3")}>{g.blurb}</span>
              {on && <Check size={18} className="absolute right-3 top-3 text-fresh" />}
            </button>
          );
        })}
      </div>
    </>
  );
}

function NumberField({ label, value, onChange, unit, min, max }: { label: string; value: number; onChange: (v: number) => void; unit: string; min: number; max: number }) {
  const id = `f-${label}`;
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-soft">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[12px] font-semibold text-ink-3">{label}</label>
        <div className="flex items-baseline gap-1">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            value={Number.isFinite(value) ? value : ""}
            min={min}
            max={max}
            onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
            className="w-14 bg-transparent text-right text-xl font-bold text-forest tabular-nums outline-none"
          />
          <span className="text-[12px] font-semibold text-ink-3">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={Math.min(max, Math.max(min, value || min))}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={`${label} slider`}
        className="mt-2 w-full accent-[#103D2B]"
      />
    </div>
  );
}

function StepAbout({ p, up }: StepProps) {
  return (
    <>
      <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight text-forest">Tell us about you</h1>
      <p className="mt-1 text-sm text-ink-2">Used only to estimate your daily needs. Stored on this device.</p>
      <Q title="What should we call you?" />
      <input
        value={p.name}
        onChange={(e) => up({ name: e.target.value })}
        placeholder="First name"
        aria-label="First name"
        autoComplete="given-name"
        className="h-13 w-full rounded-2xl bg-white px-4 py-3.5 text-[15px] font-semibold text-ink shadow-soft outline-none ring-fresh placeholder:font-medium placeholder:text-ink-3 focus:ring-2"
      />
      <div className="mt-3 grid grid-cols-1 gap-3 @md:grid-cols-3">
        <NumberField label="Age" unit="yrs" value={p.age} onChange={(age) => up({ age })} min={14} max={100} />
        <NumberField label="Height" unit="cm" value={p.heightCm} onChange={(heightCm) => up({ heightCm })} min={120} max={220} />
        <NumberField label="Weight" unit="kg" value={p.weightKg} onChange={(weightKg) => up({ weightKg })} min={35} max={200} />
      </div>
      <Q title="Gender" hint="Optional — helps estimate energy needs." />
      <div className="flex flex-wrap gap-2">
        {GENDERS.map((g) => (
          <Chip key={g.id} active={p.gender === g.id} onClick={() => up({ gender: g.id })}>{g.label}</Chip>
        ))}
      </div>
      <Q title="Activity level" />
      <div className="grid grid-cols-3 gap-2">
        {ACTIVITY.map((a) => {
          const on = p.activity === a.id;
          return (
            <button key={a.id} onClick={() => up({ activity: a.id })} aria-pressed={on} className={cx("rounded-2xl p-3 text-left transition", on ? "bg-forest text-white shadow-lift" : "bg-white shadow-soft")}>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cx("h-4 w-1.5 rounded-full", i <= ACTIVITY.indexOf(a) ? (on ? "bg-fresh" : "bg-forest") : on ? "bg-white/20" : "bg-sage-200")} />
                ))}
              </span>
              <span className="mt-2 block text-[14px] font-bold">{a.label}</span>
              <span className={cx("block text-[11px] leading-tight", on ? "text-white/70" : "text-ink-3")}>{a.hint}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepDiet({ p, up }: StepProps) {
  const [avoidInput, setAvoidInput] = useState("");
  const toggleDiet = (d: Diet) => {
    if (d === "none") return up({ diets: ["none"] });
    const rest = p.diets.filter((x) => x !== "none");
    let next = rest.includes(d) ? rest.filter((x) => x !== d) : [...rest, d];
    if (d === "vegan" && next.includes("vegan")) next = next.filter((x) => x !== "vegetarian");
    if (d === "vegetarian" && next.includes("vegetarian")) next = next.filter((x) => x !== "vegan");
    up({ diets: next.length ? next : ["none"] });
  };
  const addAvoid = () => {
    const v = avoidInput.trim();
    if (v && !p.avoid.includes(v)) up({ avoid: [...p.avoid, v] });
    setAvoidInput("");
  };
  return (
    <>
      <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight text-forest">How do you like to eat?</h1>
      <p className="mt-1 text-sm text-ink-2">Select all that apply.</p>
      <Q title="Dietary preferences" />
      <div className="grid grid-cols-2 gap-2">
        {DIETS.map((d) => {
          const on = p.diets.includes(d.id);
          return (
            <button key={d.id} onClick={() => toggleDiet(d.id)} aria-pressed={on} className={cx("flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[14px] font-semibold transition", on ? "bg-forest text-white shadow-lift" : "bg-white text-ink shadow-soft")}>
              {d.label}
              <span className={cx("grid size-5 place-items-center rounded-full", on ? "bg-fresh text-forest" : "ring-1 ring-line")}>{on && <Check size={12} strokeWidth={3} />}</span>
            </button>
          );
        })}
      </div>
      <Q title="Allergies & intolerances" hint="We'll hide products and recipes that contain them." />
      <div className="flex flex-wrap gap-2">
        {ALLERGENS.map((a) => (
          <Chip
            key={a.id}
            active={p.allergies.includes(a.id)}
            onClick={() => up({ allergies: p.allergies.includes(a.id) ? p.allergies.filter((x) => x !== a.id) : [...p.allergies, a.id] })}
          >
            {a.label}
          </Chip>
        ))}
      </div>
      <Q title="Ingredients you want to avoid" hint="e.g. onions, sugar, mushrooms" />
      <div className="flex gap-2">
        <input
          value={avoidInput}
          onChange={(e) => setAvoidInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAvoid()}
          placeholder="Type an ingredient"
          aria-label="Ingredient to avoid"
          className="flex-1 rounded-2xl bg-white px-4 py-3 text-[14px] shadow-soft outline-none ring-fresh focus:ring-2"
        />
        <Button variant="secondary" onClick={addAvoid}>Add</Button>
      </div>
      {p.avoid.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.avoid.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full bg-berry-100 py-1.5 pl-3 pr-1.5 text-[12.5px] font-semibold text-berry">
              {a}
              <button aria-label={`Remove ${a}`} onClick={() => up({ avoid: p.avoid.filter((x) => x !== a) })} className="grid size-5 place-items-center rounded-full hover:bg-berry/15">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function StepLifestyle({ p, up }: StepProps) {
  return (
    <>
      <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight text-forest">Your everyday life</h1>
      <p className="mt-1 text-sm text-ink-2">So suggestions fit your schedule and wallet.</p>
      <Q title="How much time do you have to prepare meals?" />
      <div className="grid grid-cols-4 gap-2">
        {COOK_TIMES.map((c) => (
          <button key={c.id} onClick={() => up({ cookTime: c.id })} aria-pressed={p.cookTime === c.id} className={cx("rounded-2xl px-1 py-3 text-[13px] font-bold transition", p.cookTime === c.id ? "bg-forest text-white shadow-lift" : "bg-white text-ink shadow-soft")}>
            {c.label}
          </button>
        ))}
      </div>
      <Q title="What is your food budget?" />
      <div className="grid grid-cols-3 gap-2">
        {BUDGETS.map((b) => (
          <button key={b.id} onClick={() => up({ budget: b.id })} aria-pressed={p.budget === b.id} className={cx("rounded-2xl p-3 text-left transition", p.budget === b.id ? "bg-forest text-white shadow-lift" : "bg-white shadow-soft")}>
            <span className="block text-[14px] font-bold">{b.label}</span>
            <span className={cx("block text-[11px]", p.budget === b.id ? "text-white/70" : "text-ink-3")}>{b.hint}</span>
          </button>
        ))}
      </div>
      <Q title="How many meals do you usually eat per day?" />
      <div className="flex gap-2">
        {[2, 3, 4, 5, 6].map((n) => (
          <button key={n} onClick={() => up({ mealsPerDay: n })} aria-pressed={p.mealsPerDay === n} className={cx("grid size-12 place-items-center rounded-2xl text-[15px] font-bold transition", p.mealsPerDay === n ? "bg-forest text-white shadow-lift" : "bg-white text-ink shadow-soft")}>
            {n}
          </button>
        ))}
      </div>
      <Q title="Are you a student?" hint="Unlock exclusive student offers in the Student Corner." />
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: true, l: "Yes, I'm a student 🎓" },
          { v: false, l: "No" },
        ].map((o) => (
          <button key={String(o.v)} onClick={() => up({ isStudent: o.v, occupation: o.v ? "University student" : "" })} aria-pressed={p.isStudent === o.v} className={cx("rounded-2xl px-4 py-3.5 text-[14px] font-semibold transition", p.isStudent === o.v ? "bg-forest text-white shadow-lift" : "bg-white text-ink shadow-soft")}>
            {o.l}
          </button>
        ))}
      </div>
    </>
  );
}

function Finishing({ name, onDone }: { name: string; onDone: () => void }) {
  const items = ["Calculating your daily targets", "Matching Hengstenberg products", "Building your meal plan"];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= items.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n + 1), 650);
    return () => clearTimeout(t);
  }, [n, items.length, onDone]);
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-forest px-8 text-center text-white lg:min-h-[calc(min(880px,100dvh-4rem)-38px)]">
      <div className="relative grid size-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-fresh/30" />
        <span className="relative grid size-20 place-items-center rounded-full bg-fresh text-forest"><Sparkles size={34} /></span>
      </div>
      <h1 className="mt-8 font-display text-[28px] font-semibold">Personalising your plan, {name}…</h1>
      <ul className="mt-6 space-y-3 text-left">
        {items.map((t, i) => (
          <li key={t} className={cx("flex items-center gap-3 text-[14px] transition-opacity", i <= n ? "opacity-100" : "opacity-30")}>
            {i < n ? <span className="grid size-6 place-items-center rounded-full bg-fresh text-forest"><Check size={14} strokeWidth={3} /></span> : <Loader2 size={22} className={i === n ? "animate-spin text-fresh" : "text-white/40"} />}
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
