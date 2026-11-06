import { Heart, Plus, Clock, Flame, Leaf, Sparkles, Check } from "lucide-react";
import type { Product, Recipe, ProductTag } from "../lib/types.ts";
import { ProductArt } from "./ProductArt.tsx";
import { MealArt } from "./MealArt.tsx";
import { Button, Tag, cx } from "./ui.tsx";
import { useApp } from "../store/useApp.ts";
import { euro } from "../lib/dates.ts";
import { productMatchesGoal } from "../lib/recommend.ts";

export const TAG_LABEL: Record<ProductTag, string> = {
  "high-fibre": "High fibre",
  "low-calorie": "Low calorie",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "low-sugar": "Low sugar",
  "gluten-free": "Gluten-free",
  "low-fat": "Low fat",
  fermented: "Fermented",
};

export function useAddToCart() {
  const add = useApp((s) => s.addToCart);
  const toast = useApp((s) => s.showToast);
  return (p: Product, qty = 1) => {
    add(p.id, "product", qty);
    toast(`${p.name} added to cart`, { label: "View cart", route: { name: "cart" } });
  };
}

function FavButton({ id, className }: { id: string; className?: string }) {
  const fav = useApp((s) => s.favorites.products.includes(id));
  const toggle = useApp((s) => s.toggleFavProduct);
  return (
    <button
      aria-label={fav ? "Remove from favourites" : "Save to favourites"}
      aria-pressed={fav}
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
      className={cx("grid size-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition active:scale-90", className)}
    >
      <Heart size={15} className={fav ? "fill-berry text-berry" : "text-ink-2"} />
    </button>
  );
}

/** Horizontal product card used in the catalogue. */
export function ProductCard({ product: p }: { product: Product }) {
  const navigate = useApp((s) => s.navigate);
  const profile = useApp((s) => s.profile);
  const addToCart = useAddToCart();
  const fitsGoal = productMatchesGoal(p, profile);
  const dietTags = p.tags.filter((t) => t === "vegan" || t === "gluten-free" || t === "high-fibre" || t === "low-sugar").slice(0, 3);
  return (
    <article className="rounded-3xl bg-white p-3 shadow-soft">
      <div className="flex gap-3.5">
        <button
          onClick={() => navigate("product", { id: p.id })}
          className="relative grid w-[108px] shrink-0 place-items-center overflow-hidden rounded-2xl"
          style={{ background: p.art.bg }}
          aria-label={`View details for ${p.name}`}
        >
          <ProductArt art={p.art} seed={p.id} showBg={false} className="size-[108px] transition-transform duration-500 hover:scale-105" title={p.name} />
          {fitsGoal && (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-forest px-2 py-1 text-[9.5px] font-bold text-white">
              <Sparkles size={10} /> For you
            </span>
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-fresh-600">{p.brand}</p>
              <h3 className="text-[15px] font-bold leading-tight text-ink">{p.name}</h3>
            </div>
            <FavButton id={p.id} className="-mr-1 -mt-1 bg-cream" />
          </div>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-2">{p.short}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Tag tone="fresh">{p.highlights[0]}</Tag>
            {dietTags.map((t) => (
              <Tag key={t} tone="cream">{TAG_LABEL[t]}</Tag>
            ))}
          </div>
          <p className="mt-2 text-[17px] font-extrabold leading-tight text-forest tabular-nums">
            {euro(p.price)} <span className="text-[10.5px] font-medium text-ink-3">{p.size} · sample price</span>
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => navigate("product", { id: p.id })}>
          View Details
        </Button>
        <Button size="sm" variant="primary" className="whitespace-nowrap" icon={<Plus size={15} />} onClick={() => addToCart(p)} aria-label={`Add ${p.name} to cart`}>
          Add to Cart
        </Button>
      </div>
    </article>
  );
}

/** Compact vertical card used in carousels. */
export function ProductTile({ product: p, reason }: { product: Product; reason?: string }) {
  const navigate = useApp((s) => s.navigate);
  const addToCart = useAddToCart();
  return (
    <article className="relative flex w-[160px] shrink-0 flex-col rounded-3xl bg-white p-2.5 shadow-soft">
      <button onClick={() => navigate("product", { id: p.id })} className="relative overflow-hidden rounded-2xl" style={{ background: p.art.bg }} aria-label={`View details for ${p.name}`}>
        <ProductArt art={p.art} seed={p.id} showBg={false} className="mx-auto size-[130px]" title={p.name} />
      </button>
      <FavButton id={p.id} className="absolute right-4 top-4" />
      <div className="flex flex-1 flex-col px-1 pt-2">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-ink">{p.name}</h3>
        {reason && (
          <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-forest-600">
            <Leaf size={11} className="mt-0.5 shrink-0" />
            {reason}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[15px] font-extrabold text-forest tabular-nums">{euro(p.price)}</span>
          <button
            aria-label={`Add ${p.name} to cart`}
            onClick={() => addToCart(p)}
            className="grid size-8 place-items-center rounded-full bg-forest text-white shadow-soft transition active:scale-90 hover:bg-forest-700"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function RecipeMeta({ r, className }: { r: Recipe; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-medium text-ink-3", className)}>
      <span className="inline-flex items-center gap-1"><Clock size={12} />{r.minutes} min</span>
      <span className="inline-flex items-center gap-1"><Flame size={12} />{r.kcal} kcal</span>
      <span className="tabular-nums">≈ {euro(r.costEur)}</span>
    </div>
  );
}

export function RecipeRow({ recipe: r, onClick, right, done }: { recipe: Recipe; onClick?: () => void; right?: React.ReactNode; done?: boolean }) {
  const navigate = useApp((s) => s.navigate);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-soft">
      <button onClick={onClick ?? (() => navigate("recipe", { id: r.id }))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="relative size-14 shrink-0">
          <MealArt colors={r.colors} seed={r.id} className={cx("size-14", done && "opacity-60")} />
          {done && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-6 place-items-center rounded-full bg-fresh text-white shadow"><Check size={14} strokeWidth={3} /></span>
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className={cx("truncate text-[14px] font-bold text-ink", done && "line-through decoration-fresh decoration-2")}>{r.name}</p>
          <RecipeMeta r={r} className="mt-0.5" />
        </div>
      </button>
      {right}
    </div>
  );
}
