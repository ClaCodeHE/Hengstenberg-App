import { Home, Store, Sparkles, GraduationCap, User } from "lucide-react";
import { useApp, useRoute, type ScreenName } from "../store/useApp.ts";
import { cx } from "./ui.tsx";

const ITEMS: { name: ScreenName; label: string; Icon: typeof Home }[] = [
  { name: "home", label: "Home", Icon: Home },
  { name: "products", label: "Products", Icon: Store },
  { name: "assistant", label: "AI Assistant", Icon: Sparkles },
  { name: "student", label: "Student", Icon: GraduationCap },
  { name: "profile", label: "Profile", Icon: User },
];

const PARENT: Partial<Record<ScreenName, ScreenName>> = {
  planner: "home", progress: "home", reminders: "profile", orders: "profile", recipe: "home",
};

export const NAV_SCREENS: ScreenName[] = ["home", "products", "assistant", "student", "profile", "planner", "progress", "reminders", "orders"];

export function BottomNav() {
  const route = useRoute();
  const tab = useApp((s) => s.tab);
  const active = PARENT[route.name] ?? route.name;
  return (
    <nav aria-label="Main" className="absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-[560px] items-center justify-between rounded-[28px] bg-white/95 px-2 py-1.5 shadow-lift ring-1 ring-black/5 backdrop-blur-md">
        {ITEMS.map(({ name, label, Icon }) => {
          const on = active === name;
          if (name === "assistant") {
            return (
              <button key={name} onClick={() => tab(name)} aria-label={label} aria-current={on ? "page" : undefined} className="group -mt-7 flex flex-1 flex-col items-center gap-1">
                <span className={cx("grid size-14 place-items-center rounded-full border-4 border-cream shadow-lift transition group-active:scale-95", on ? "bg-fresh text-forest" : "bg-forest text-white")}>
                  <Sparkles size={22} />
                </span>
                <span className={cx("text-[10px] font-semibold", on ? "text-forest" : "text-ink-3")}>AI Assistant</span>
              </button>
            );
          }
          return (
            <button key={name} onClick={() => tab(name)} aria-label={label} aria-current={on ? "page" : undefined} className="flex flex-1 flex-col items-center gap-1 py-1.5">
              <span className={cx("grid h-8 w-12 place-items-center rounded-full transition", on ? "bg-fresh-100 text-forest" : "text-ink-3")}>
                <Icon size={20} strokeWidth={on ? 2.4 : 2} />
              </span>
              <span className={cx("text-[10px] font-semibold", on ? "text-forest" : "text-ink-3")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
