import { ArrowRight, Sparkles, Truck, Leaf, UserRound } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, Logo } from "../components/ui.tsx";
import { ProductArt } from "../components/ProductArt.tsx";
import { productById } from "../data/products.ts";

export function Welcome() {
  const navigate = useApp((s) => s.navigate);
  const loadDemo = useApp((s) => s.loadDemo);
  const kraut = productById("mildessa-sauerkraut")!;
  const knax = productById("knax-gherkins")!;
  const red = productById("red-cabbage-apple")!;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-forest lg:min-h-[calc(min(880px,100dvh-4rem)-38px)]">
      {/* hero */}
      <div className="relative flex-1 overflow-hidden px-6 pt-[max(20px,env(safe-area-inset-top))]">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-fresh/20 blur-3xl" />
        <div className="absolute -right-20 top-40 size-64 rounded-full bg-fresh/10 blur-3xl" />
        <Leaves />
        <div className="relative flex items-center justify-between">
          <Logo light />
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-semibold text-white/80 ring-1 ring-white/15">Prototype</span>
        </div>

        <div className="relative mx-auto mt-6 h-[300px] max-w-[340px]">
          <div className="absolute left-1/2 top-1/2 size-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-fresh/35 to-fresh/5" />
          <ProductArt art={knax.art} seed={knax.id} showBg={false} className="absolute left-0 top-10 size-[150px] -rotate-6 animate-float [animation-delay:-2s]" title={knax.name} />
          <ProductArt art={red.art} seed={red.id} showBg={false} className="absolute right-0 top-12 size-[150px] rotate-6 animate-float [animation-delay:-4s]" title={red.name} />
          <ProductArt art={kraut.art} seed={kraut.id} showBg={false} className="absolute left-1/2 top-4 size-[200px] -translate-x-1/2 animate-float" title={kraut.name} />

          <div className="absolute -left-1 bottom-2 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-lift animate-pop [animation-delay:300ms]">
            <span className="grid size-7 place-items-center rounded-full bg-fresh-100 text-forest"><Sparkles size={14} /></span>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-forest">AI-powered</p>
              <p className="text-[10px] text-ink-3">Personal advice</p>
            </div>
          </div>
          <div className="absolute -right-1 bottom-10 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-lift animate-pop [animation-delay:500ms]">
            <span className="grid size-7 place-items-center rounded-full bg-berry-100 text-berry"><Truck size={14} /></span>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-forest">24/7 Delivery</p>
              <p className="text-[10px] text-ink-3">Order anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="relative rounded-t-[36px] bg-cream px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-7 stagger">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-fresh-600">Good food. A healthier you.</p>
        <h1 className="mt-2 font-display text-[40px] font-semibold leading-[1.02] text-forest">
          Smart <span className="italic text-fresh-600">Nutrition</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Your personal food &amp; nutrition assistant powered by AI.</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { I: Sparkles, t: "Personal plans" },
            { I: Leaf, t: "Healthy products" },
            { I: Truck, t: "24/7 delivery" },
          ].map(({ I, t }) => (
            <div key={t} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center shadow-soft">
              <I size={18} className="text-forest-600" />
              <span className="text-[11px] font-semibold text-ink-2">{t}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Button size="lg" full onClick={() => navigate("onboarding")}>
            Get Started <ArrowRight size={18} />
          </Button>
          <Button size="lg" full variant="outline" onClick={() => navigate("products")}>
            Explore Products
          </Button>
        </div>
        <button onClick={loadDemo} className="mx-auto mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-forest-600 hover:text-forest">
          <UserRound size={14} /> Try the demo profile (Emma, 22)
        </button>
      </div>
    </div>
  );
}

function Leaves() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {[
        [40, 120, 20], [350, 80, -30], [320, 300, 40], [70, 330, -10], [200, 40, 60],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0 C 20 -30, 60 -30, 80 0 C 60 30, 20 30, 0 0 Z" fill="#8BC34A" />
          <path d="M0 0 L80 0" stroke="#103D2B" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}
