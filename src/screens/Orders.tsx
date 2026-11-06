import { Package, ChevronRight } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, TopBar, cx } from "../components/ui.tsx";
import { ORDER_STEPS, orderStep } from "../lib/orders.ts";
import { euro } from "../lib/dates.ts";

export function Orders() {
  const orders = useApp((s) => s.orders);
  const navigate = useApp((s) => s.navigate);
  const tab = useApp((s) => s.tab);
  return (
    <div>
      <TopBar title="My orders" />
      <div className="space-y-2.5 px-5">
        {orders.length === 0 ? (
          <div className="pt-12 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage text-forest"><Package size={26} /></span>
            <p className="mt-4 font-display text-xl text-forest">No orders yet</p>
            <Button className="mt-4" onClick={() => tab("products")}>Start shopping</Button>
          </div>
        ) : (
          orders.map((o) => {
            const step = orderStep(o);
            return (
              <button key={o.id} onClick={() => navigate("order", { id: o.id })} className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-left shadow-soft">
                <span className={cx("grid size-11 place-items-center rounded-2xl", step >= 3 ? "bg-sage text-forest" : "bg-fresh-100 text-forest")}><Package size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink">{o.id}</p>
                  <p className="truncate text-[12px] text-ink-3">
                    {new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {o.lines.reduce((s, l) => s + l.qty, 0)} items · {euro(o.total)}
                  </p>
                </div>
                <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-bold", step >= 3 ? "bg-sage text-ink-2" : "bg-forest text-white")}>{ORDER_STEPS[step].label}</span>
                <ChevronRight size={16} className="text-ink-3" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
