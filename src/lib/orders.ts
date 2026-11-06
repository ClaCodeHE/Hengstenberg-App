import type { Order } from "./types.ts";

export const ORDER_STEPS = [
  { id: "placed", label: "Order placed", hint: "We've received your order" },
  { id: "preparing", label: "Preparing", hint: "Your partner store is packing your items" },
  { id: "on-the-way", label: "On the way", hint: "Your courier is heading to you" },
  { id: "delivered", label: "Delivered", hint: "Enjoy your food!" },
] as const;

/** Demo timeline (accelerated): seconds after placing for each step. */
const THRESHOLDS = [0, 8, 20, 50];

export function orderStep(o: Order, now = Date.now()): number {
  let auto = 0;
  if (o.delivery === "asap") {
    const sec = (now - o.placedAt) / 1000;
    THRESHOLDS.forEach((t, i) => {
      if (sec >= t) auto = i;
    });
  }
  return Math.min(3, auto + o.manualStep);
}

/** Progress (0..1) of the courier along the route while "on the way". */
export function courierProgress(o: Order, now = Date.now()): number {
  const step = orderStep(o, now);
  if (step < 2) return 0;
  if (step >= 3) return 1;
  if (o.delivery !== "asap" || o.manualStep > 0) return 0.5;
  const sec = (now - o.placedAt) / 1000;
  return Math.min(1, Math.max(0, (sec - THRESHOLDS[2]) / (THRESHOLDS[3] - THRESHOLDS[2])));
}

export const etaDate = (o: Order) => new Date(o.placedAt + 30 * 60 * 1000);
