import { CheckCircle2 } from "lucide-react";
import { useApp } from "../store/useApp.ts";

export function Toast({ withNav }: { withNav: boolean }) {
  const toast = useApp((s) => s.toast);
  const navigate = useApp((s) => s.navigate);
  if (!toast) return null;
  return (
    <div key={toast.id} role="status" aria-live="polite" className={`pointer-events-none absolute inset-x-0 z-[60] flex justify-center px-4 ${withNav ? "bottom-28" : "top-[76px]"}`}>
      <div className="pointer-events-auto flex max-w-[400px] items-center gap-3 rounded-2xl bg-forest py-2.5 pl-4 pr-2.5 text-white shadow-lift animate-pop">
        <CheckCircle2 size={18} className="shrink-0 text-fresh" />
        <span className="text-[13px] font-medium">{toast.text}</span>
        {toast.action && (
          <button onClick={() => navigate(toast.action!.route.name, toast.action!.route.params)} className="ml-1 shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-[12px] font-bold hover:bg-white/25">
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
