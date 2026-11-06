import { productById } from "../data/products.ts";
import { bundleById, promotionByCode } from "../data/promotions.ts";
import type { CartLine, DeliveryMode } from "./types.ts";

export const unitPrice = (line: CartLine) =>
  line.kind === "bundle" ? bundleById(line.id)?.price ?? 0 : productById(line.id)?.price ?? 0;

export const lineName = (line: CartLine) =>
  line.kind === "bundle" ? bundleById(line.id)?.name ?? line.id : productById(line.id)?.name ?? line.id;

export interface PromoResult {
  ok: boolean;
  discount: number;
  message: string;
}

export function evaluatePromo(code: string | null, cart: CartLine[], studentVerified: boolean): PromoResult {
  if (!code) return { ok: false, discount: 0, message: "" };
  const promo = promotionByCode(code);
  if (!promo) return { ok: false, discount: 0, message: "This code isn't valid." };
  if (promo.requiresStudent && !studentVerified)
    return { ok: false, discount: 0, message: "Verify your student status in the Student Corner to use this code." };

  if (promo.code === "KNAX3") {
    const line = cart.find((l) => l.kind === "product" && l.id === "knax-gherkins");
    const free = line ? Math.floor(line.qty / 3) : 0;
    if (!free) return { ok: false, discount: 0, message: "Add 3 jars of KNAX Gherkins — the third one is free." };
    return { ok: true, discount: free * unitPrice(line!), message: `${free} jar${free > 1 ? "s" : ""} of KNAX free` };
  }
  if (promo.bundleId) {
    const line = cart.find((l) => l.kind === "bundle" && l.id === promo.bundleId);
    if (!line) return { ok: false, discount: 0, message: `Add the ${bundleById(promo.bundleId)?.name} to use this code.` };
    const pct = promo.code === "STARTER15" ? 0.15 : 0.1;
    return { ok: true, discount: round(unitPrice(line) * line.qty * pct), message: promo.title };
  }
  return { ok: false, discount: 0, message: "This code isn't valid." };
}

export const FREE_DELIVERY_FROM = 20;
export const STUDENT_FREE_DELIVERY_FROM = 10;

export function deliveryFee(subtotal: number, mode: DeliveryMode, studentVerified: boolean) {
  if (subtotal === 0) return 0;
  if (subtotal >= (studentVerified ? STUDENT_FREE_DELIVERY_FROM : FREE_DELIVERY_FROM)) return 0;
  return mode === "asap" ? 2.49 : 1.49;
}

export const round = (n: number) => Math.round(n * 100) / 100;

export function cartTotals(cart: CartLine[], code: string | null, studentVerified: boolean, mode: DeliveryMode = "asap") {
  const subtotal = round(cart.reduce((s, l) => s + unitPrice(l) * l.qty, 0));
  const promo = evaluatePromo(code, cart, studentVerified);
  const discount = promo.ok ? promo.discount : 0;
  const fee = deliveryFee(subtotal - discount, mode, studentVerified);
  return { subtotal, promo, discount, fee, total: round(subtotal - discount + fee), count: cart.reduce((s, l) => s + l.qty, 0) };
}
