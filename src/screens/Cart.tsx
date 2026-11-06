import { useState } from "react";
import { ShoppingBag, Trash2, Tag as TagIcon, Truck, GraduationCap, ChevronRight, Check } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, DemoNote, QtyStepper, TopBar, cx } from "../components/ui.tsx";
import { ProductArt } from "../components/ProductArt.tsx";
import { productById } from "../data/products.ts";
import { bundleById, promotions } from "../data/promotions.ts";
import { cartTotals, FREE_DELIVERY_FROM, STUDENT_FREE_DELIVERY_FROM, lineName, unitPrice } from "../lib/pricing.ts";
import { euro } from "../lib/dates.ts";

export function Cart() {
  const cart = useApp((s) => s.cart);
  const promoCode = useApp((s) => s.promoCode);
  const student = useApp((s) => s.student);
  const setQty = useApp((s) => s.setQty);
  const remove = useApp((s) => s.removeFromCart);
  const setPromo = useApp((s) => s.setPromo);
  const navigate = useApp((s) => s.navigate);
  const tab = useApp((s) => s.tab);
  const [code, setCode] = useState(promoCode ?? "");
  const t = cartTotals(cart, promoCode, student.verified);
  const freeFrom = student.verified ? STUDENT_FREE_DELIVERY_FROM : FREE_DELIVERY_FROM;
  const toFree = Math.max(0, freeFrom - (t.subtotal - t.discount));

  if (cart.length === 0) {
    return (
      <div>
        <TopBar title="Your cart" />
        <div className="px-8 pt-16 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-sage text-forest"><ShoppingBag size={32} /></span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-forest">Your cart is empty</h2>
          <p className="mt-1 text-sm text-ink-2">Discover healthy Hengstenberg products — delivered 24/7.</p>
          <Button className="mt-6" onClick={() => tab("products")}>Explore products</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Your cart" right={<span className="text-[12px] font-semibold text-ink-3">{t.count} item{t.count === 1 ? "" : "s"}</span>} />
      <div className="space-y-4 px-5 pb-4">
        <div className="space-y-2.5">
          {cart.map((l) => {
            const p = l.kind === "product" ? productById(l.id) : undefined;
            const b = l.kind === "bundle" ? bundleById(l.id) : undefined;
            const art = p?.art ?? productById(b!.items[0].productId)!.art;
            return (
              <div key={l.id} className="flex gap-3 rounded-3xl bg-white p-3 shadow-soft">
                <button onClick={() => p && navigate("product", { id: p.id })} className="grid size-[76px] shrink-0 place-items-center rounded-2xl" style={{ background: art.bg }} aria-label={lineName(l)}>
                  {b ? (
                    <div className="relative size-[76px]">
                      {b.items.slice(0, 3).map((i, idx) => {
                        const pp = productById(i.productId)!;
                        return (
                          <div key={i.productId} className="absolute" style={{ left: 2 + idx * 10, top: 4 + idx * 8 }}>
                            <ProductArt art={pp.art} seed={pp.id} showBg={false} className="size-[54px]" title={pp.name} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <ProductArt art={art} seed={l.id} showBg={false} className="size-[76px]" />
                  )}
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {b && <p className="text-[10px] font-bold uppercase tracking-wider text-berry">Bundle</p>}
                      <p className="text-[14px] font-bold leading-tight text-ink">{lineName(l)}</p>
                      <p className="text-[11.5px] text-ink-3">{p ? p.size : `${b!.items.length} products`} · {euro(unitPrice(l))}</p>
                    </div>
                    <button aria-label={`Remove ${lineName(l)}`} onClick={() => remove(l.id)} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-berry-100 hover:text-berry"><Trash2 size={15} /></button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QtyStepper small qty={l.qty} onChange={(q) => setQty(l.id, q)} />
                    <span className="text-[15px] font-extrabold text-forest tabular-nums">{euro(unitPrice(l) * l.qty)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* student */}
        {!student.verified && (
          <button onClick={() => tab("student")} className="flex w-full items-center gap-3 rounded-3xl bg-fresh-100 p-3.5 text-left">
            <span className="grid size-10 place-items-center rounded-2xl bg-white text-forest"><GraduationCap size={19} /></span>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-forest">Student? Save more</p>
              <p className="text-[11.5px] text-forest/70">Verify to unlock student discounts &amp; free delivery from €10.</p>
            </div>
            <ChevronRight size={17} className="text-forest/60" />
          </button>
        )}

        {/* promo */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink"><TagIcon size={15} /> Promo code</p>
          <form onSubmit={(e) => { e.preventDefault(); setPromo(code || null); }} className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" aria-label="Promo code" className="min-w-0 flex-1 rounded-2xl bg-cream px-4 py-2.5 text-[14px] font-semibold uppercase tracking-wider outline-none ring-fresh focus:ring-2" />
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {promotions.map((p) => (
              <button key={p.code} onClick={() => { setCode(p.code); setPromo(p.code); }} className={cx("rounded-full px-3 py-1.5 text-[11.5px] font-bold transition", promoCode === p.code ? "bg-forest text-white" : "bg-cream-200 text-ink-2 hover:bg-sage")}>
                {p.code} · {p.badge}
              </button>
            ))}
          </div>
          {promoCode && (
            <p className={cx("mt-2.5 flex items-center gap-1.5 text-[12.5px] font-semibold", t.promo.ok ? "text-forest-600" : "text-berry")}>
              {t.promo.ok && <Check size={14} strokeWidth={3} />} {t.promo.ok ? `${promoCode} applied — ${t.promo.message}` : t.promo.message}
              {promoCode && <button onClick={() => { setPromo(null); setCode(""); }} className="ml-auto text-[11.5px] text-ink-3 underline">Remove</button>}
            </p>
          )}
        </section>

        {/* summary */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <div className="space-y-2 text-[13.5px]">
            <Row l="Subtotal" v={euro(t.subtotal)} />
            {t.discount > 0 && <Row l={`Discount (${promoCode})`} v={`− ${euro(t.discount)}`} green />}
            <Row l="Delivery (ASAP)" v={t.fee === 0 ? "Free" : euro(t.fee)} green={t.fee === 0} />
            <div className="border-t border-dashed border-line pt-2">
              <Row l="Total" v={euro(t.total)} bold />
            </div>
          </div>
          {toFree > 0 && (
            <p className="mt-3 rounded-2xl bg-cream px-3 py-2 text-[12px] text-ink-2">
              Add <b>{euro(toFree)}</b> more for free delivery.
            </p>
          )}
        </section>

        <div className="flex items-center gap-3 rounded-3xl bg-forest p-4 text-white">
          <Truck size={22} className="shrink-0 text-fresh" />
          <p className="text-[12.5px] leading-snug"><b>24/7 Delivery</b> — choose as soon as possible or schedule a time at checkout.</p>
        </div>
        <DemoNote>Prices and offers are sample data for the prototype.</DemoNote>
      </div>

      <div className="sticky bottom-0 border-t border-line/70 bg-cream/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <Button size="lg" full onClick={() => navigate("checkout")}>
          Continue to checkout · {euro(t.total)}
        </Button>
      </div>
    </div>
  );
}

export function Row({ l, v, bold, green }: { l: string; v: string; bold?: boolean; green?: boolean }) {
  return (
    <div className={cx("flex items-center justify-between", bold ? "text-[16px] font-extrabold text-forest" : "text-ink-2")}>
      <span>{l}</span>
      <span className={cx("tabular-nums", green && "font-semibold text-forest-600")}>{v}</span>
    </div>
  );
}
