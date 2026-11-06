import { useState } from "react";
import { GraduationCap, BadgeCheck, Mail, Copy, ShoppingBag, Loader2, Wallet } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, CartButton, DemoNote, SectionHeader, Tag, cx } from "../components/ui.tsx";
import { ProductArt } from "../components/ProductArt.tsx";
import { ProductTile, RecipeRow } from "../components/cards.tsx";
import { bundles, bundleById, promotions, type Promotion } from "../data/promotions.ts";
import { productById, products } from "../data/products.ts";
import { recipes } from "../data/recipes.ts";
import { recipeFits } from "../lib/recommend.ts";
import { euro } from "../lib/dates.ts";

const UNI_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|uni-[a-z0-9-]+\.[a-z]{2,}|[a-z0-9-]*(uni|university|hochschule|student|students|tu-|th-|fh-)[a-z0-9-]*\.[a-z.]{2,})$/i;

export function Student() {
  const profile = useApp((s) => s.profile);
  const student = useApp((s) => s.student);
  const verify = useApp((s) => s.verifyStudent);
  const addToCart = useApp((s) => s.addToCart);
  const setPromo = useApp((s) => s.setPromo);
  const navigate = useApp((s) => s.navigate);
  const toast = useApp((s) => s.showToast);
  const [email, setEmail] = useState(student.email);
  const [step, setStep] = useState<"idle" | "sending" | "code">("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const sendCode = () => {
    if (!UNI_EMAIL.test(email.trim())) {
      setError("Please use your university email (e.g. name@uni-stuttgart.de or name@student.university.edu).");
      return;
    }
    setError("");
    setStep("sending");
    setTimeout(() => setStep("code"), 900);
  };
  const confirm = () => {
    if (code.trim().length !== 6) return setError("Enter the 6-digit code (demo: any 6 digits).");
    verify(email.trim());
    setStep("idle");
    setError("");
    toast("🎓 Student status verified — offers unlocked!");
  };

  const shopNow = (promo: Promotion) => {
    if (promo.requiresStudent && !student.verified) {
      toast("Verify your student email first to unlock this offer");
      document.getElementById("verify")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (promo.bundleId) addToCart(promo.bundleId, "bundle");
    if (promo.productIds) addToCart(promo.productIds[0], "product", 3);
    setPromo(promo.code);
    toast(`Added to cart · code ${promo.code} applied`, { label: "View cart", route: { name: "cart" } });
  };

  const budget = [...products].sort((a, b) => a.price - b.price).slice(0, 5);
  const meals = recipes.filter((r) => r.student && r.costEur <= 2.5 && recipeFits(r, profile)).slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden rounded-b-[36px] bg-forest px-5 pb-8 pt-[max(18px,env(safe-area-inset-top))] text-white">
        <div className="absolute -left-10 bottom-0 size-48 rounded-full bg-fresh/20 blur-2xl" />
        <div className="absolute right-6 top-20 size-24 rounded-full bg-berry/25 blur-xl" />
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-bold ring-1 ring-white/15">
            <GraduationCap size={15} className="text-fresh" /> Student Corner
          </span>
          <CartButton light />
        </div>
        <h1 className="relative mt-5 font-display text-[32px] font-semibold leading-[1.08]">
          Good food for a <span className="italic text-fresh">brighter tomorrow.</span>
        </h1>
        <p className="relative mt-2 text-[13.5px] text-white/70">Exclusive discounts, budget bundles and quick meal ideas for students.</p>
      </section>

      <div className="space-y-7 px-5 pt-5">
        {/* verification */}
        <section id="verify" className="rounded-3xl bg-white p-4 shadow-soft">
          {student.verified ? (
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-fresh-100 text-forest"><BadgeCheck size={24} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-forest">Verified student</p>
                <p className="truncate text-[12px] text-ink-3">{student.email}</p>
              </div>
              <Tag tone="fresh">Offers unlocked</Tag>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage text-forest"><Mail size={20} /></span>
                <div>
                  <h2 className="text-[15px] font-bold text-ink">Verify your student status</h2>
                  <p className="text-[12.5px] text-ink-3">Use your university email to unlock exclusive offers and free delivery from €10.</p>
                </div>
              </div>
              {step !== "code" ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@uni-stuttgart.de"
                    aria-label="University email"
                    className="min-w-0 flex-1 rounded-2xl bg-cream px-4 py-3 text-[14px] outline-none ring-fresh focus:ring-2"
                  />
                  <Button onClick={sendCode} disabled={step === "sending" || !email}>
                    {step === "sending" ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                  </Button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="mb-2 text-[12.5px] text-ink-2">We sent a 6-digit code to <b>{email}</b> (demo — enter any 6 digits).</p>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="••••••"
                      aria-label="Verification code"
                      className="min-w-0 flex-1 rounded-2xl bg-cream px-4 py-3 text-center text-[18px] font-bold tracking-[0.5em] outline-none ring-fresh focus:ring-2"
                    />
                    <Button onClick={confirm}>Confirm</Button>
                  </div>
                </div>
              )}
              {error && <p className="mt-2 text-[12px] font-medium text-berry">{error}</p>}
            </>
          )}
        </section>

        {/* promotions */}
        <section>
          <SectionHeader title="Exclusive offers" />
          <div className="space-y-3">
            {promotions.map((promo) => <PromoCard key={promo.id} promo={promo} locked={promo.requiresStudent && !student.verified} onShop={() => shopNow(promo)} />)}
          </div>
          <DemoNote className="mt-3">All offers are demo promotions for this prototype — not real Hengstenberg campaigns.</DemoNote>
        </section>

        {/* bundles */}
        <section>
          <SectionHeader title="Student bundles" />
          <div className="grid gap-3 @xl:grid-cols-2">
            {bundles.map((b) => {
              const worth = b.items.reduce((s, i) => s + productById(i.productId)!.price * i.qty, 0);
              return (
                <div key={b.id} className="rounded-3xl bg-white p-4 shadow-soft">
                  <div className="flex -space-x-6">
                    {b.items.map((i) => {
                      const p = productById(i.productId)!;
                      return (
                        <div key={i.productId} className="grid size-20 place-items-center rounded-2xl ring-4 ring-white" style={{ background: p.art.bg }}>
                          <ProductArt art={p.art} seed={p.id} showBg={false} className="size-20" title={p.name} />
                        </div>
                      );
                    })}
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-ink">{b.name}</h3>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{b.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[18px] font-extrabold text-forest tabular-nums">{euro(b.price)}</span>
                      <span className="ml-2 text-[12px] text-ink-3 line-through tabular-nums">{euro(worth)}</span>
                    </div>
                    <Button size="sm" icon={<ShoppingBag size={14} />} onClick={() => { addToCart(b.id, "bundle"); toast(`${b.name} added to cart`, { label: "View cart", route: { name: "cart" } }); }}>
                      Add bundle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* budget products */}
        <section>
          <SectionHeader title="Budget-friendly picks" action="All products" onAction={() => navigate("products")} />
          <p className="-mt-2 mb-3 flex items-center gap-1.5 text-[12.5px] text-ink-3"><Wallet size={13} /> Healthy staples under €2.30</p>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {budget.map((p) => <ProductTile key={p.id} product={p} reason={`Only ${euro(p.price)}`} />)}
          </div>
        </section>

        {/* meal ideas */}
        <section>
          <SectionHeader title="Student meal ideas" action="Planner" onAction={() => navigate("planner")} />
          <p className="-mt-2 mb-3 text-[12.5px] text-ink-3">Under €2.50 per portion · minimal equipment</p>
          <div className="space-y-2.5">
            {meals.map((r) => <RecipeRow key={r.id} recipe={r} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function PromoCard({ promo, locked, onShop }: { promo: Promotion; locked: boolean; onShop: () => void }) {
  const toast = useApp((s) => s.showToast);
  const bundle = promo.bundleId ? bundleById(promo.bundleId) : undefined;
  const items = bundle ? bundle.items.map((i) => productById(i.productId)!) : (promo.productIds ?? []).map((id) => productById(id)!);
  const price = bundle ? bundle.price : items[0].price * 2;
  const finalPrice = promo.code === "STARTER15" ? price * 0.85 : promo.code === "SNACK10" ? price * 0.9 : price;
  const tone = {
    green: "bg-gradient-to-br from-forest to-forest-600 text-white",
    red: "bg-gradient-to-br from-berry to-[#9e0c25] text-white",
    cream: "bg-gradient-to-br from-[#f6efd9] to-[#efe4c3] text-forest",
  }[promo.tone];
  const sub = promo.tone === "cream" ? "text-forest/70" : "text-white/75";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
    } catch {
      /* clipboard may be unavailable */
    }
    toast(`Code ${promo.code} copied`);
  };

  return (
    <article className={cx("relative overflow-hidden rounded-[28px] p-4 shadow-soft", tone)}>
      <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/10" />
      <div className="relative flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cx("rounded-full px-2.5 py-1 text-[13px] font-extrabold", promo.tone === "cream" ? "bg-forest text-white" : "bg-white text-forest")}>{promo.badge}</span>
            <span className={cx("text-[10px] font-bold uppercase tracking-wider", sub)}>Demo offer</span>
          </div>
          <h3 className="mt-2 font-display text-[19px] font-semibold leading-tight">{promo.title}</h3>
          <p className={cx("mt-1 text-[12px] leading-snug", sub)}>{promo.description}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[18px] font-extrabold tabular-nums">{euro(finalPrice)}</span>
            {finalPrice !== price && <span className={cx("text-[12px] line-through tabular-nums", sub)}>{euro(price)}</span>}
            {promo.code === "KNAX3" && <span className={cx("text-[11.5px]", sub)}>for 3 jars</span>}
          </div>
        </div>
        <div className="relative h-[110px] w-[104px] shrink-0">
          {items.slice(0, 3).map((p, i) => (
            <div key={p.id + i} className="absolute" style={{ left: i * 14, top: i * 10, zIndex: 3 - i }}>
              <ProductArt art={p.art} seed={p.id} showBg={false} className="size-[86px] drop-shadow-lg" title={p.name} />
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-3 flex items-center gap-2">
        <button onClick={copy} className={cx("flex items-center gap-1.5 rounded-full border border-dashed px-3 py-2 text-[12px] font-bold", promo.tone === "cream" ? "border-forest/40" : "border-white/50")}>
          <Copy size={13} /> {promo.code}
        </button>
        <button onClick={onShop} className={cx("ml-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95", promo.tone === "cream" ? "bg-forest text-white" : "bg-white text-forest")}>
          {locked ? "Verify to unlock" : "Shop Now"}
        </button>
      </div>
    </article>
  );
}
