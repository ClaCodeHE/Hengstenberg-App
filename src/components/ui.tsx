import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, X, Info } from "lucide-react";
import { useApp } from "../store/useApp.ts";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type BtnVariant = "primary" | "fresh" | "secondary" | "ghost" | "outline" | "danger";

export function Button({
  variant = "primary", size = "md", full, className, children, icon, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; full?: boolean; icon?: ReactNode }) {
  const v: Record<BtnVariant, string> = {
    primary: "bg-forest text-white hover:bg-forest-700 shadow-soft",
    fresh: "bg-fresh text-forest hover:bg-fresh-600 hover:text-white shadow-soft",
    secondary: "bg-sage text-forest hover:bg-sage-200",
    ghost: "text-forest hover:bg-sage/70",
    outline: "border border-forest/20 text-forest bg-white hover:border-forest/40",
    danger: "bg-berry-100 text-berry hover:bg-berry hover:text-white",
  };
  const s = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-5 text-sm", lg: "h-14 px-6 text-base" }[size];
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100",
        v[variant], s, full && "w-full", className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cx("grid size-10 shrink-0 place-items-center rounded-full bg-white text-forest shadow-soft transition active:scale-95 hover:bg-cream-200", className)}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={cx("rounded-3xl bg-white shadow-soft text-left", onClick && "transition active:scale-[0.985] hover:shadow-lift", className)}>
      {children}
    </Tag>
  );
}

export function Chip({ active, children, onClick, className, icon }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition",
        active ? "bg-forest text-white shadow-soft" : "bg-white text-ink-2 hover:text-forest ring-1 ring-line",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Tag({ children, tone = "sage", className }: { children: ReactNode; tone?: "sage" | "fresh" | "berry" | "cream" | "forest"; className?: string }) {
  const t = {
    sage: "bg-sage text-forest",
    fresh: "bg-fresh-100 text-forest-600",
    berry: "bg-berry-100 text-berry",
    cream: "bg-cream-200 text-ink-2",
    forest: "bg-forest text-white",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", t, className)}>{children}</span>;
}

export function SectionHeader({ title, action, onAction, className }: { title: string; action?: string; onAction?: () => void; className?: string }) {
  return (
    <div className={cx("mb-3 flex items-end justify-between", className)}>
      <h2 className="font-display text-[19px] font-semibold text-forest">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold text-forest-600 hover:text-forest">
          {action}
        </button>
      )}
    </div>
  );
}

export function ProgressRing({
  value, max, size = 120, stroke = 12, color = "#8BC34A", track = "rgb(255 255 255 / 0.14)", children, label,
}: { value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, max, color = "bg-fresh", className, label }: { value: number; max: number; color?: string; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-sage", className)} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemax={max}>
      <div className={cx("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx("relative h-7 w-12 shrink-0 rounded-full transition", on ? "bg-fresh" : "bg-sage-200")}
    >
      <span className={cx("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function QtyStepper({ qty, onChange, small }: { qty: number; onChange: (q: number) => void; small?: boolean }) {
  const s = small ? "size-7" : "size-9";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-sage p-1">
      <button aria-label="Decrease quantity" onClick={() => onChange(qty - 1)} className={cx("grid place-items-center rounded-full bg-white text-forest shadow-sm active:scale-90", s)}>
        <Minus size={14} />
      </button>
      <span className="min-w-6 text-center text-sm font-bold text-forest tabular-nums">{qty}</span>
      <button aria-label="Increase quantity" onClick={() => onChange(qty + 1)} className={cx("grid place-items-center rounded-full bg-forest text-white shadow-sm active:scale-90", s)}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-forest/40 backdrop-blur-[2px] animate-[fade-up_.2s_both]" onClick={onClose} />
      <div className="relative max-h-[85%] w-full overflow-y-auto rounded-t-[32px] bg-cream px-5 pb-8 pt-3 shadow-lift animate-[fade-up_.3s_both]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-sage-200" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-forest">{title}</h3>
          <IconButton label="Close" onClick={onClose} className="size-9">
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DemoNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("flex items-start gap-1.5 text-[11px] leading-snug text-ink-3", className)}>
      <Info size={12} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function CartButton({ light }: { light?: boolean }) {
  const count = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const navigate = useApp((s) => s.navigate);
  return (
    <button
      aria-label={`Shopping cart, ${count} items`}
      onClick={() => navigate("cart")}
      className={cx("relative grid size-10 place-items-center rounded-full transition active:scale-95", light ? "bg-white/15 text-white hover:bg-white/25" : "bg-white text-forest shadow-soft")}
    >
      <ShoppingBag size={19} />
      {count > 0 && (
        <span key={count} className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-berry px-1 text-[10px] font-bold text-white animate-pop">
          {count}
        </span>
      )}
    </button>
  );
}

export function TopBar({ title, right, transparent, onBack }: { title?: string; right?: ReactNode; transparent?: boolean; onBack?: () => void }) {
  const back = useApp((s) => s.back);
  return (
    <header className={cx("sticky top-0 z-30 flex items-center gap-3 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]", !transparent && "bg-cream/90 backdrop-blur-md")}>
      <IconButton label="Back" onClick={onBack ?? back}>
        <ArrowLeft size={19} />
      </IconButton>
      <h1 className="min-w-0 flex-1 truncate text-center font-display text-lg font-semibold text-forest">{title}</h1>
      <div className="flex min-w-10 justify-end gap-2">{right}</div>
    </header>
  );
}

export function Logo({ light, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const t = { sm: "text-[13px]", md: "text-[15px]", lg: "text-xl" }[size];
  return (
    <div className={cx("flex items-center gap-2", light ? "text-white" : "text-forest")}>
      <svg viewBox="0 0 32 32" className={size === "lg" ? "size-9" : "size-7"} aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={light ? "#FAF8F2" : "#103D2B"} />
        <path d="M10 23V9h3v5.5h6V9h3v14h-3v-5.5h-6V23z" fill={light ? "#103D2B" : "#FAF8F2"} />
        <circle cx="24.5" cy="7.5" r="2.6" fill="#C8102E" />
      </svg>
      <span className={cx("font-display font-semibold tracking-[0.12em] uppercase", t)}>Hengstenberg</span>
    </div>
  );
}
