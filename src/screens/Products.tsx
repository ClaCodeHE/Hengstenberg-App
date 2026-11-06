import { useMemo, useState } from "react";
import { Search, X, Truck } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { CartButton, Chip, DemoNote, Logo } from "../components/ui.tsx";
import { ProductCard } from "../components/cards.tsx";
import { products } from "../data/products.ts";
import { productFits, productMatchesGoal } from "../lib/recommend.ts";
import { goalInfo } from "../lib/nutrition.ts";
import type { ProductTag } from "../lib/types.ts";

type Filter = "all" | "goal" | ProductTag;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "goal", label: "Suitable for my goal" },
  { id: "high-fibre", label: "High fibre" },
  { id: "low-calorie", label: "Low calorie" },
  { id: "vegan", label: "Vegan" },
  { id: "low-sugar", label: "Low sugar" },
];

export function Products({ initialFilter }: { initialFilter?: string }) {
  const profile = useApp((s) => s.profile);
  const back = useApp((s) => s.back);
  const stackLen = useApp((s) => s.stack.length);
  const [filter, setFilter] = useState<Filter>((initialFilter as Filter) ?? "all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (needle && !`${p.name} ${p.brand} ${p.short} ${p.category}`.toLowerCase().includes(needle)) return false;
      if (filter === "all") return true;
      if (filter === "goal") return profile ? productMatchesGoal(p, profile) : true;
      return p.tags.includes(filter);
    });
  }, [filter, q, profile]);

  const hidden = profile ? products.filter((p) => !productFits(p, profile)).length : 0;

  return (
    <div>
      <header className="sticky top-0 z-30 bg-cream/92 px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center justify-between">
          {!profile && stackLen > 1 ? (
            <button onClick={back} className="text-[13px] font-semibold text-forest-600">← Back</button>
          ) : (
            <Logo size="sm" />
          )}
          <CartButton />
        </div>
        <h1 className="mt-3 font-display text-[28px] font-semibold leading-tight text-forest">Discover products</h1>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-4 shadow-soft ring-fresh focus-within:ring-2">
          <Search size={17} className="text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sauerkraut, gherkins…" aria-label="Search products" className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3" />
          {q && (
            <button aria-label="Clear search" onClick={() => setQ("")}><X size={16} className="text-ink-3" /></button>
          )}
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.id === "goal" && profile ? `For my goal ${goalInfo(profile.goal).emoji}` : f.label}
            </Chip>
          ))}
        </div>
      </header>

      <div className="px-5 pt-2">
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-forest px-4 py-3 text-white">
          <Truck size={18} className="shrink-0 text-fresh" />
          <p className="text-[12.5px] leading-snug"><span className="font-bold">24/7 Delivery</span> — order now, delivered as soon as possible or when it suits you.</p>
        </div>

        <p className="mb-3 text-[12.5px] font-medium text-ink-3">
          {list.length} product{list.length === 1 ? "" : "s"}
          {filter === "goal" && profile && ` matching "${goalInfo(profile.goal).label}" and your diet`}
        </p>
        {list.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
            <p className="font-display text-lg text-forest">No products found</p>
            <p className="mt-1 text-[13px] text-ink-3">Try another filter or search term.</p>
          </div>
        ) : (
          <div className="grid gap-3 @xl:grid-cols-2 stagger">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {hidden > 0 && filter === "goal" && (
          <p className="mt-3 text-[12px] text-ink-3">{hidden} product{hidden > 1 ? "s are" : " is"} hidden because of your allergies or avoided ingredients.</p>
        )}
        <DemoNote className="mt-5">Prototype: nutrition values, ingredients and prices are sample data and must be verified against product packaging.</DemoNote>
      </div>
    </div>
  );
}
