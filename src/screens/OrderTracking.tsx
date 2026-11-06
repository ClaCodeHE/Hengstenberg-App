import { useEffect, useState } from "react";
import { Check, Package, ChefHat, Bike, Home, PartyPopper, Phone, MessageCircle, FastForward, MapPin, CalendarClock } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, DemoNote, TopBar, cx } from "../components/ui.tsx";
import { ORDER_STEPS, courierProgress, etaDate, orderStep } from "../lib/orders.ts";
import { euro, formatTime } from "../lib/dates.ts";
import { Row } from "./Cart.tsx";

const ICONS = [Package, ChefHat, Bike, Home];
const PAY_LABEL = { applepay: "Apple Pay", paypal: "PayPal", card: "Card •••• 4242", klarna: "Pay later" } as const;

export function OrderTracking({ id }: { id: string }) {
  const order = useApp((s) => s.orders.find((o) => o.id === id));
  const advance = useApp((s) => s.advanceOrder);
  const tab = useApp((s) => s.tab);
  const isNew = useApp((s) => s.stack[s.stack.length - 1].params?.new === "1");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  if (!order) return <TopBar title="Order not found" />;
  const step = orderStep(order, now);
  const progress = courierProgress(order, now);
  const delivered = step >= 3;
  const eta = etaDate(order);
  const stepTimes = [0, 4, 12, 30].map((m) => formatTime(new Date(order.placedAt + m * 60000)));

  return (
    <div className="pb-8">
      <TopBar title={`Order ${order.id}`} onBack={() => tab("home")} />
      <div className="space-y-4 px-5">
        {isNew && step === 0 && (
          <section className="flex items-center gap-3 rounded-3xl bg-fresh p-4 text-forest animate-pop">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/60"><PartyPopper size={24} /></span>
            <div>
              <p className="font-display text-[19px] font-semibold leading-tight">Order confirmed!</p>
              <p className="text-[12.5px] text-forest/75">Thanks! We've sent a confirmation to your inbox (demo).</p>
            </div>
          </section>
        )}

        {/* ETA */}
        <section className="overflow-hidden rounded-[28px] bg-forest text-white shadow-lift">
          <div className="flex items-center justify-between p-4 pb-2">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-white/60">{delivered ? "Delivered" : order.delivery === "asap" ? "Estimated arrival" : "Scheduled delivery"}</p>
              <p className="font-display text-[30px] font-semibold leading-tight">
                {delivered ? "Enjoy! 🥗" : order.delivery === "asap" ? formatTime(eta) : order.slotLabel}
              </p>
              {!delivered && order.delivery === "asap" && <p className="text-[12px] text-white/65">25–35 min · 24/7 Delivery</p>}
            </div>
            <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
              {order.delivery === "asap" ? <Bike size={26} className="text-fresh" /> : <CalendarClock size={26} className="text-fresh" />}
            </span>
          </div>
          <RouteMap progress={progress} step={step} />
        </section>

        {/* timeline */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <ol className="relative">
            {ORDER_STEPS.map((s, i) => {
              const Icon = ICONS[i];
              const done = i < step || delivered;
              const current = i === step && !delivered;
              return (
                <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < ORDER_STEPS.length - 1 && (
                    <span className={cx("absolute left-[19px] top-10 h-[calc(100%-36px)] w-0.5 rounded-full transition-colors duration-700", i < step ? "bg-fresh" : "bg-sage-200")} />
                  )}
                  <span className={cx("relative grid size-10 shrink-0 place-items-center rounded-full transition-all duration-500", done ? "bg-fresh text-white" : current ? "bg-forest text-white ring-4 ring-fresh/40" : "bg-sage text-ink-3")}>
                    {done ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                    {current && <span className="absolute inset-0 animate-ping rounded-full bg-fresh/30" />}
                  </span>
                  <div className="pt-1">
                    <p className={cx("text-[14px] font-bold", i <= step ? "text-ink" : "text-ink-3")}>{i + 1}. {s.label}</p>
                    <p className="text-[12px] text-ink-3">{i <= step ? s.hint : "Pending"}{i <= step && order.delivery === "asap" ? ` · ${stepTimes[i]}` : ""}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {step === 2 && (
          <section className="flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-soft animate-[fade-up_.3s_both]">
            <span className="grid size-11 place-items-center rounded-full bg-sage font-display text-lg font-semibold text-forest">L</span>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-ink">Lukas · your courier</p>
              <p className="text-[12px] text-ink-3">E-bike · demo courier</p>
            </div>
            <button aria-label="Message courier" className="grid size-10 place-items-center rounded-full bg-sage text-forest"><MessageCircle size={17} /></button>
            <button aria-label="Call courier" className="grid size-10 place-items-center rounded-full bg-forest text-white"><Phone size={17} /></button>
          </section>
        )}

        {!delivered && (
          <Button variant="secondary" full icon={<FastForward size={16} />} onClick={() => advance(order.id)}>
            Simulate next step (demo)
          </Button>
        )}
        {delivered && (
          <Button full onClick={() => tab("products")}>Order again</Button>
        )}

        {/* details */}
        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <h2 className="mb-2 text-[15px] font-bold text-ink">Order details</h2>
          <ul className="mb-3 space-y-1.5 text-[13px]">
            {order.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-ink-2">
                <span className="truncate"><b className="text-ink">{l.qty}×</b> {l.name}</span>
                <span className="tabular-nums">{euro(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-dashed border-line pt-3 text-[13.5px]">
            <Row l="Subtotal" v={euro(order.subtotal)} />
            {order.discount > 0 && <Row l={`Discount (${order.promoCode})`} v={`− ${euro(order.discount)}`} green />}
            <Row l="Delivery" v={order.deliveryFee === 0 ? "Free" : euro(order.deliveryFee)} green={order.deliveryFee === 0} />
            <Row l="Total paid" v={euro(order.total)} bold />
          </div>
          <div className="mt-3 space-y-1 rounded-2xl bg-cream p-3 text-[12.5px] text-ink-2">
            <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-forest" /> {order.address.name}, {order.address.street}, {order.address.zip} {order.address.city}</p>
            {order.instructions && <p className="pl-[22px] text-ink-3">“{order.instructions}”</p>}
            <p className="pl-[22px] text-ink-3">Paid with {PAY_LABEL[order.payment]}</p>
          </div>
        </section>
        <DemoNote>Demo tracking with sample order data — the timeline is simulated and accelerated. No real delivery takes place.</DemoNote>
      </div>
    </div>
  );
}

/** Stylised city map with an animated courier along the route. */
function RouteMap({ progress, step }: { progress: number; step: number }) {
  const pts: [number, number][] = [[40, 120], [40, 80], [130, 80], [130, 40], [230, 40], [230, 95], [300, 95]];
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let dist = progress * total;
  let pos = pts[0];
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i]) {
      const f = segs[i] ? dist / segs[i] : 0;
      pos = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
      break;
    }
    dist -= segs[i];
    pos = pts[i + 1];
  }
  const d = `M${pts.map((p) => p.join(" ")).join(" L")}`;
  return (
    <svg viewBox="0 0 340 150" className="block w-full bg-[#18492f]" role="img" aria-label={`Delivery route map, courier ${Math.round(progress * 100)}% of the way`}>
      {/* blocks */}
      {[[10, 10, 100, 55], [60, 95, 50, 45], [150, 10, 60, 18], [150, 55, 60, 85], [250, 10, 80, 70], [250, 112, 80, 30], [10, 135, 30, 10]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={8} fill="#1f5a3b" />
      ))}
      <circle cx="285" cy="35" r="14" fill="#2a6b45" />
      <circle cx="80" cy="35" r="10" fill="#2a6b45" />
      <path d={d} stroke="#2f6e4a" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#8BC34A" strokeWidth="3.5" fill="none" strokeDasharray="7 7" strokeLinecap="round" strokeLinejoin="round" opacity={step >= 2 ? 1 : 0.4} />
      {/* store */}
      <g transform="translate(40 120)">
        <circle r="13" fill="#FAF8F2" />
        <path d="M-6 -2 h12 v8 h-12z M-7 -2 l2 -5 h10 l2 5" fill="#103D2B" />
      </g>
      {/* home */}
      <g transform="translate(300 95)">
        <circle r="14" fill="#C8102E" />
        <path d="M-6 1 l6 -6 l6 6 v6 h-12z" fill="#fff" />
      </g>
      {/* courier */}
      {step >= 2 && (
        <g transform={`translate(${pos[0]} ${pos[1]})`} style={{ transition: "transform 0.5s linear" }}>
          <circle r="15" fill="#8BC34A" opacity="0.3">
            <animate attributeName="r" values="12;18;12" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="10" fill="#8BC34A" stroke="#fff" strokeWidth="2.5" />
          <path d="M-4 1 a2.4 2.4 0 1 0 0.1 0 M4 1 a2.4 2.4 0 1 0 0.1 0 M-4 1 L-1 -3 L3 -3 L4 1" stroke="#103D2B" strokeWidth="1.4" fill="none" />
        </g>
      )}
    </svg>
  );
}
