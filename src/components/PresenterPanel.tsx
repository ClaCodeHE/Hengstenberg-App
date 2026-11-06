import { Check, RotateCcw, UserRound, Sparkles, GraduationCap, CalendarDays, LineChart } from "lucide-react";
import { useApp, type ScreenName } from "../store/useApp.ts";
import { Logo, cx } from "./ui.tsx";

const JOURNEY: { label: string; screen: ScreenName; params?: Record<string, string> }[] = [
  { label: "Welcome", screen: "welcome" },
  { label: "Create nutrition profile", screen: "onboarding" },
  { label: "Personalised recommendations", screen: "home" },
  { label: "Explore product details", screen: "product", params: { id: "mildessa-sauerkraut" } },
  { label: "Add to cart", screen: "cart" },
  { label: "Choose 24/7 delivery", screen: "checkout" },
  { label: "Track demo order", screen: "order" },
];

/** Desktop-only side panel to drive the demo during a presentation. */
export function PresenterPanel() {
  const s = useApp();
  const current = s.stack[s.stack.length - 1].name;

  const go = (screen: ScreenName, params?: Record<string, string>) => {
    const st = useApp.getState();
    const needsProfile = !["welcome", "onboarding", "products", "product"].includes(screen);
    if (needsProfile && !st.profile) st.loadDemo();
    if ((screen === "cart" || screen === "checkout") && useApp.getState().cart.length === 0) {
      st.addToCart("mildessa-sauerkraut");
      st.addToCart("knax-gherkins", "product", 3);
      st.addToCart("student-starter-pack", "bundle");
    }
    if (screen === "order") {
      let order = useApp.getState().orders[0];
      if (!order) {
        if (useApp.getState().cart.length === 0) {
          st.addToCart("mildessa-sauerkraut");
          st.addToCart("red-cabbage-apple");
        }
        order = useApp.getState().placeOrder({ delivery: "asap", instructions: "Please ring twice", payment: "applepay" });
      }
      useApp.setState({ stack: [{ name: "home" }, { name: "order", params: { id: order.id } }] });
      return;
    }
    if (screen === "welcome" || screen === "onboarding") useApp.setState({ stack: [{ name: screen }] });
    else if (["home", "products", "assistant", "student", "profile"].includes(screen)) useApp.setState({ stack: [{ name: screen }] });
    else useApp.setState({ stack: [{ name: "home" }, { name: screen, params }] });
  };

  return (
    <aside className="hidden w-[300px] shrink-0 lg:block">
      <Logo size="lg" />
      <h1 className="mt-6 font-display text-[34px] font-semibold leading-[1.1] text-forest">
        Smart Nutrition
      </h1>
      <p className="mt-2 font-display text-lg italic text-forest-600">Good food. A healthier you.</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        Interactive prototype — AI-powered nutrition guidance, meal planning, direct shopping and student offers in one app.
      </p>

      <div className="mt-7 rounded-3xl bg-white/70 p-4 shadow-soft ring-1 ring-black/5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">Customer journey</p>
        <ol className="space-y-0.5">
          {JOURNEY.map((j, i) => {
            const on = current === j.screen;
            return (
              <li key={j.label}>
                <button
                  onClick={() => go(j.screen, j.params)}
                  className={cx("flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-[13px] font-semibold transition", on ? "bg-forest text-white" : "text-ink-2 hover:bg-sage")}
                >
                  <span className={cx("grid size-6 shrink-0 place-items-center rounded-full text-[11px]", on ? "bg-fresh text-forest" : "bg-sage text-forest")}>
                    {on ? <Check size={13} /> : i + 1}
                  </span>
                  {j.label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { l: "AI Assistant", s: "assistant" as const, I: Sparkles },
          { l: "Student Corner", s: "student" as const, I: GraduationCap },
          { l: "Meal Planner", s: "planner" as const, I: CalendarDays },
          { l: "Progress", s: "progress" as const, I: LineChart },
        ].map(({ l, s: scr, I }) => (
          <button key={l} onClick={() => go(scr)} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2.5 text-[12.5px] font-semibold text-forest shadow-soft ring-1 ring-black/5 hover:bg-white">
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => s.loadDemo()} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest px-4 py-2.5 text-[12.5px] font-semibold text-white hover:bg-forest-700">
          <UserRound size={15} /> Demo profile: Emma
        </button>
        <button onClick={() => s.resetAll()} aria-label="Reset demo" title="Reset demo" className="grid size-10 place-items-center rounded-full bg-white text-forest shadow-soft hover:bg-cream-200">
          <RotateCcw size={16} />
        </button>
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-3">
        University innovation project. Product data, prices, promotions and delivery are demo samples. Nutrition guidance is general and not medical advice.
      </p>
    </aside>
  );
}
