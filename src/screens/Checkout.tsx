import { useMemo, useState } from "react";
import { MapPin, Zap, CalendarClock, CreditCard, Wallet, Smartphone, Loader2, Lock, Check, Moon } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, DemoNote, TopBar, cx } from "../components/ui.tsx";
import { cartTotals, lineName, unitPrice } from "../lib/pricing.ts";
import { addDays, euro, weekdayShort } from "../lib/dates.ts";
import type { Address, DeliveryMode, PaymentMethod } from "../lib/types.ts";
import { Row } from "./Cart.tsx";

const PAYMENTS: { id: PaymentMethod; label: string; sub: string; I: typeof CreditCard }[] = [
  { id: "applepay", label: "Apple Pay", sub: "Fast & secure", I: Smartphone },
  { id: "paypal", label: "PayPal", sub: "Pay with your account", I: Wallet },
  { id: "card", label: "Credit / debit card", sub: "Visa •••• 4242", I: CreditCard },
  { id: "klarna", label: "Pay later", sub: "Pay in 30 days", I: CalendarClock },
];

const INSTRUCTION_CHIPS = ["Leave at the door", "Ring the bell", "Call on arrival", "Hand to me personally"];

export function Checkout() {
  const cart = useApp((s) => s.cart);
  const promoCode = useApp((s) => s.promoCode);
  const student = useApp((s) => s.student);
  const savedAddress = useApp((s) => s.address);
  const setAddress = useApp((s) => s.setAddress);
  const placeOrder = useApp((s) => s.placeOrder);
  const back = useApp((s) => s.back);
  const [addr, setAddr] = useState<Address>(savedAddress);
  const [mode, setMode] = useState<DeliveryMode>("asap");
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("applepay");
  const [placing, setPlacing] = useState(false);
  const [touched, setTouched] = useState(false);
  const t = cartTotals(cart, promoCode, student.verified, mode);

  const slots = useMemo(() => {
    const nowH = new Date().getHours();
    return Array.from({ length: 12 }, (_, i) => {
      const from = i * 2;
      return { i, label: `${String(from).padStart(2, "0")}:00–${String((from + 2) % 24).padStart(2, "0")}:00`, disabled: day === 0 && from + 2 <= nowH + 1, night: from < 6 || from >= 22 };
    });
  }, [day]);

  const addrValid = addr.name.trim() && addr.street.trim() && addr.zip.trim() && addr.city.trim();
  const valid = addrValid && (mode === "asap" || slot !== null) && cart.length > 0;
  const dayLabel = day === 0 ? "Today" : day === 1 ? "Tomorrow" : weekdayShort(addDays(new Date(), day));

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    setAddress(addr);
    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder({
        delivery: mode,
        slotLabel: mode === "scheduled" && slot !== null ? `${dayLabel}, ${slots[slot].label}` : undefined,
        instructions,
        payment,
      });
      useApp.setState((s) => ({ stack: [...s.stack.filter((r) => r.name !== "cart" && r.name !== "checkout"), { name: "order", params: { id: order.id, new: "1" } }] }));
    }, 1400);
  };

  if (cart.length === 0 && !placing) {
    return (
      <div>
        <TopBar title="Checkout" />
        <div className="px-6 pt-16 text-center">
          <p className="font-display text-xl text-forest">Your cart is empty</p>
          <Button className="mt-4" onClick={back}>Go back</Button>
        </div>
      </div>
    );
  }

  const field = (k: keyof Address, label: string, auto: string, cls = "") => (
    <label className={cx("block", cls)}>
      <span className="mb-1 block text-[11.5px] font-semibold text-ink-3">{label}</span>
      <input
        value={addr[k]}
        autoComplete={auto}
        onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
        aria-invalid={touched && !addr[k].trim() && k !== "phone"}
        className={cx("w-full rounded-2xl bg-cream px-3.5 py-2.5 text-[14px] outline-none focus:ring-2", touched && !addr[k].trim() && k !== "phone" ? "ring-2 ring-berry/60" : "ring-fresh")}
      />
    </label>
  );

  return (
    <div>
      <TopBar title="Checkout" />
      <div className="space-y-4 px-5 pb-4">
        {/* address */}
        <Section n={1} title="Delivery address" icon={<MapPin size={16} />}>
          <div className="grid grid-cols-3 gap-2.5">
            {field("name", "Full name", "name", "col-span-3")}
            {field("street", "Street & number", "street-address", "col-span-3")}
            {field("zip", "ZIP", "postal-code")}
            {field("city", "City", "address-level2", "col-span-2")}
            {field("phone", "Phone (optional)", "tel", "col-span-3")}
          </div>
        </Section>

        {/* delivery time */}
        <Section n={2} title="Delivery time" icon={<Zap size={16} />} badge="24/7">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => setMode("asap")} aria-pressed={mode === "asap"} className={cx("relative rounded-2xl p-3.5 text-left transition", mode === "asap" ? "bg-forest text-white shadow-lift" : "bg-cream text-ink")}>
              <Zap size={18} className={mode === "asap" ? "text-fresh" : "text-forest"} />
              <p className="mt-2 text-[14px] font-bold">As soon as possible</p>
              <p className={cx("text-[11.5px]", mode === "asap" ? "text-white/70" : "text-ink-3")}>Est. 25–35 min</p>
              {mode === "asap" && <Check size={16} className="absolute right-3 top-3 text-fresh" />}
            </button>
            <button onClick={() => setMode("scheduled")} aria-pressed={mode === "scheduled"} className={cx("relative rounded-2xl p-3.5 text-left transition", mode === "scheduled" ? "bg-forest text-white shadow-lift" : "bg-cream text-ink")}>
              <CalendarClock size={18} className={mode === "scheduled" ? "text-fresh" : "text-forest"} />
              <p className="mt-2 text-[14px] font-bold">Scheduled</p>
              <p className={cx("text-[11.5px]", mode === "scheduled" ? "text-white/70" : "text-ink-3")}>Pick a 2-hour slot</p>
              {mode === "scheduled" && <Check size={16} className="absolute right-3 top-3 text-fresh" />}
            </button>
          </div>
          {mode === "scheduled" && (
            <div className="mt-3 animate-[fade-up_.3s_both]">
              <div className="mb-2.5 flex gap-2">
                {[0, 1, 2].map((d) => (
                  <button key={d} onClick={() => { setDay(d); setSlot(null); }} className={cx("flex-1 rounded-xl py-2 text-[12.5px] font-bold", day === d ? "bg-forest text-white" : "bg-cream text-ink-2")}>
                    {d === 0 ? "Today" : d === 1 ? "Tomorrow" : weekdayShort(addDays(new Date(), d))}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {slots.map((s) => (
                  <button key={s.i} disabled={s.disabled} onClick={() => setSlot(s.i)} aria-pressed={slot === s.i} className={cx("relative rounded-xl py-2 text-[11.5px] font-semibold tabular-nums transition disabled:opacity-35", slot === s.i ? "bg-fresh text-forest ring-2 ring-forest" : "bg-cream text-ink-2")}>
                    {s.night && <Moon size={10} className="absolute right-1.5 top-1.5 opacity-60" />}
                    {s.label}
                  </button>
                ))}
              </div>
              {touched && slot === null && <p className="mt-2 text-[12px] font-medium text-berry">Please choose a delivery slot.</p>}
            </div>
          )}
          <DemoNote className="mt-3">Real 24/7 availability depends on your location, partner stores and delivery capacity.</DemoNote>
        </Section>

        {/* instructions */}
        <Section n={3} title="Delivery instructions">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {INSTRUCTION_CHIPS.map((c) => (
              <button key={c} onClick={() => setInstructions(c)} className={cx("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", instructions === c ? "bg-forest text-white" : "bg-cream-200 text-ink-2")}>{c}</button>
            ))}
          </div>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} placeholder="e.g. 3rd floor, door on the left" aria-label="Delivery instructions" className="w-full resize-none rounded-2xl bg-cream px-3.5 py-2.5 text-[14px] outline-none ring-fresh focus:ring-2" />
        </Section>

        {/* payment */}
        <Section n={4} title="Payment method" icon={<Lock size={15} />}>
          <div className="space-y-2">
            {PAYMENTS.map(({ id, label, sub, I }) => (
              <button key={id} onClick={() => setPayment(id)} aria-pressed={payment === id} className={cx("flex w-full items-center gap-3 rounded-2xl p-3 text-left transition", payment === id ? "bg-fresh-100 ring-2 ring-forest" : "bg-cream")}>
                <span className="grid size-10 place-items-center rounded-xl bg-white text-forest"><I size={18} /></span>
                <span className="flex-1">
                  <span className="block text-[14px] font-bold text-ink">{label}</span>
                  <span className="block text-[11.5px] text-ink-3">{sub}</span>
                </span>
                <span className={cx("grid size-5 place-items-center rounded-full border-2", payment === id ? "border-forest bg-forest" : "border-sage-200")}>
                  {payment === id && <span className="size-2 rounded-full bg-white" />}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* summary */}
        <Section n={5} title="Order summary">
          <ul className="mb-3 space-y-1.5 text-[13px]">
            {cart.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-ink-2">
                <span className="truncate"><b className="text-ink">{l.qty}×</b> {lineName(l)}</span>
                <span className="tabular-nums">{euro(unitPrice(l) * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-dashed border-line pt-3 text-[13.5px]">
            <Row l="Subtotal" v={euro(t.subtotal)} />
            {t.discount > 0 && <Row l={`Discount (${promoCode})`} v={`− ${euro(t.discount)}`} green />}
            <Row l={mode === "asap" ? "Delivery (ASAP)" : "Delivery (scheduled)"} v={t.fee === 0 ? "Free" : euro(t.fee)} green={t.fee === 0} />
            <Row l="Total" v={euro(t.total)} bold />
          </div>
        </Section>
        <DemoNote>Demo checkout: no payment is processed and no real order is placed.</DemoNote>
      </div>

      <div className="sticky bottom-0 border-t border-line/70 bg-cream/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        {touched && !addrValid && <p className="mb-2 text-center text-[12px] font-medium text-berry">Please complete your delivery address.</p>}
        <Button size="lg" full onClick={submit} disabled={placing}>
          {placing ? (<><Loader2 size={18} className="animate-spin" /> Placing order…</>) : (<>Place Order · {euro(t.total)}</>)}
        </Button>
      </div>
    </div>
  );
}

function Section({ n, title, icon, badge, children }: { n: number; title: string; icon?: React.ReactNode; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
        <span className="grid size-6 place-items-center rounded-full bg-forest text-[11px] text-white">{n}</span>
        {title}
        {icon && <span className="text-ink-3">{icon}</span>}
        {badge && <span className="ml-auto rounded-full bg-berry px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
      </h2>
      {children}
    </section>
  );
}
