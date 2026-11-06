import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Address, CartLine, ChatMessage, DeliveryMode, MealSlot, Order, PaymentMethod, Profile, ReminderSetting,
} from "../lib/types.ts";
import { DEMO_PROFILE, SLOTS } from "../lib/nutrition.ts";
import { addDays, dayKey, fromKey } from "../lib/dates.ts";
import { defaultRecipeId } from "../lib/recommend.ts";
import { cartTotals, lineName, unitPrice } from "../lib/pricing.ts";

export type ScreenName =
  | "welcome" | "onboarding" | "home" | "products" | "product" | "assistant" | "student" | "profile"
  | "planner" | "recipe" | "cart" | "checkout" | "order" | "orders" | "progress" | "reminders";

export interface Route {
  name: ScreenName;
  params?: Record<string, string>;
}

export const TABS: ScreenName[] = ["home", "products", "assistant", "student", "profile"];

export interface PlanEntry {
  recipeId: string;
  done: boolean;
  extras: string[]; // product ids added to this meal
}
export type DayPlan = Partial<Record<MealSlot, PlanEntry>>;

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; route: Route };
}

interface AppState {
  // navigation (not persisted)
  stack: Route[];
  navigate: (name: ScreenName, params?: Record<string, string>) => void;
  replace: (name: ScreenName, params?: Record<string, string>) => void;
  back: () => void;
  tab: (name: ScreenName) => void;

  toast: Toast | null;
  showToast: (text: string, action?: Toast["action"]) => void;

  // profile
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  loadDemo: () => void;
  resetAll: () => void;

  // student
  student: { verified: boolean; email: string };
  verifyStudent: (email: string) => void;

  // planner
  plan: Record<string, DayPlan>;
  favorites: { recipes: string[]; products: string[] };
  getEntry: (key: string, slot: MealSlot) => PlanEntry;
  setMeal: (key: string, slot: MealSlot, recipeId: string) => void;
  toggleDone: (key: string, slot: MealSlot) => void;
  addExtra: (key: string, slot: MealSlot, productId: string) => void;
  removeExtra: (key: string, slot: MealSlot, productId: string) => void;
  toggleFavRecipe: (id: string) => void;
  toggleFavProduct: (id: string) => void;

  // water
  water: Record<string, number>;
  setWater: (key: string, glasses: number) => void;

  // reminders
  remindersOn: boolean;
  reminders: ReminderSetting[];
  setRemindersOn: (on: boolean) => void;
  updateReminder: (id: ReminderSetting["id"], patch: Partial<ReminderSetting>) => void;

  // cart & orders
  cart: CartLine[];
  promoCode: string | null;
  addToCart: (id: string, kind?: CartLine["kind"], qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  setPromo: (code: string | null) => void;
  address: Address;
  setAddress: (a: Address) => void;
  orders: Order[];
  placeOrder: (o: { delivery: DeliveryMode; slotLabel?: string; instructions: string; payment: PaymentMethod }) => Order;
  advanceOrder: (id: string) => void;

  // chat
  chat: ChatMessage[];
  addChat: (m: ChatMessage) => void;
  clearChat: () => void;
}

const DEFAULT_REMINDERS: ReminderSetting[] = [
  { id: "meals", enabled: true, time: "12:30", days: "Daily" },
  { id: "water", enabled: true, time: "10:00", days: "Every 2 hours" },
  { id: "planning", enabled: true, time: "18:00", days: "Sundays" },
  { id: "shopping", enabled: false, time: "17:00", days: "Fridays" },
  { id: "goals", enabled: true, time: "20:30", days: "Daily check-in" },
];

const DEMO_ADDRESS: Address = { name: "Emma Becker", street: "Universitätsstraße 12", city: "Stuttgart", zip: "70174", phone: "+49 170 1234567" };
const BLANK_ADDRESS: Address = { name: "", street: "", city: "", zip: "", phone: "" };

const dayIndex = (key: string) => Math.floor(fromKey(key).getTime() / 86400000);

/** Seed a realistic week of history so the progress screen tells a story in the demo. */
function seedHistory(profile: Profile) {
  const plan: Record<string, DayPlan> = {};
  const water: Record<string, number> = {};
  const pattern = [
    [1, 1, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0], [1, 0, 1, 1], [1, 1, 1, 1], [0, 1, 1, 1],
  ];
  for (let i = 6; i >= 1; i--) {
    const key = dayKey(addDays(new Date(), -i));
    const done = pattern[6 - i];
    const day: DayPlan = {};
    SLOTS.forEach((s, j) => {
      day[s.id] = { recipeId: defaultRecipeId(s.id, profile, dayIndex(key)), done: !!done[j], extras: [] };
    });
    plan[key] = day;
    water[key] = [6, 8, 7, 5, 8, 7][6 - i];
  }
  // today: breakfast done already
  const today = dayKey();
  plan[today] = { breakfast: { recipeId: defaultRecipeId("breakfast", profile, dayIndex(today)), done: true, extras: [] } };
  water[today] = 3;
  return { plan, water };
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      stack: [{ name: "welcome" }],
      navigate: (name, params) => set((s) => ({ stack: [...s.stack, { name, params }] })),
      replace: (name, params) => set((s) => ({ stack: [...s.stack.slice(0, -1), { name, params }] })),
      back: () =>
        set((s) => ({ stack: s.stack.length > 1 ? s.stack.slice(0, -1) : [{ name: s.profile ? "home" : "welcome" }] })),
      tab: (name) => set({ stack: [{ name }] }),

      toast: null,
      showToast: (text, action) => {
        clearTimeout(toastTimer);
        set({ toast: { id: Date.now(), text, action } });
        toastTimer = setTimeout(() => set({ toast: null }), 2600);
      },

      profile: null,
      setProfile: (p) => set({ profile: p }),
      loadDemo: () => {
        const { plan, water } = seedHistory(DEMO_PROFILE);
        set({
          profile: DEMO_PROFILE,
          plan,
          water,
          address: DEMO_ADDRESS,
          student: { verified: false, email: "" },
          favorites: { recipes: ["sauerkraut-power-bowl"], products: ["knax-gherkins"] },
          chat: [],
          stack: [{ name: "home" }],
        });
      },
      resetAll: () =>
        set({
          profile: null, plan: {}, water: {}, cart: [], promoCode: null, orders: [], chat: [],
          favorites: { recipes: [], products: [] }, student: { verified: false, email: "" },
          address: BLANK_ADDRESS, reminders: DEFAULT_REMINDERS, remindersOn: true, stack: [{ name: "welcome" }],
        }),

      student: { verified: false, email: "" },
      verifyStudent: (email) => set({ student: { verified: true, email } }),

      plan: {},
      favorites: { recipes: [], products: [] },
      getEntry: (key, slot) => {
        const existing = get().plan[key]?.[slot];
        return existing ?? { recipeId: defaultRecipeId(slot, get().profile, dayIndex(key)), done: false, extras: [] };
      },
      setMeal: (key, slot, recipeId) => {
        const e = get().getEntry(key, slot);
        set((s) => ({ plan: { ...s.plan, [key]: { ...s.plan[key], [slot]: { ...e, recipeId } } } }));
      },
      toggleDone: (key, slot) => {
        const e = get().getEntry(key, slot);
        set((s) => ({ plan: { ...s.plan, [key]: { ...s.plan[key], [slot]: { ...e, done: !e.done } } } }));
      },
      addExtra: (key, slot, productId) => {
        const e = get().getEntry(key, slot);
        if (e.extras.includes(productId)) return;
        set((s) => ({ plan: { ...s.plan, [key]: { ...s.plan[key], [slot]: { ...e, extras: [...e.extras, productId] } } } }));
      },
      removeExtra: (key, slot, productId) => {
        const e = get().getEntry(key, slot);
        set((s) => ({
          plan: { ...s.plan, [key]: { ...s.plan[key], [slot]: { ...e, extras: e.extras.filter((x) => x !== productId) } } },
        }));
      },
      toggleFavRecipe: (id) =>
        set((s) => ({
          favorites: {
            ...s.favorites,
            recipes: s.favorites.recipes.includes(id) ? s.favorites.recipes.filter((x) => x !== id) : [...s.favorites.recipes, id],
          },
        })),
      toggleFavProduct: (id) =>
        set((s) => ({
          favorites: {
            ...s.favorites,
            products: s.favorites.products.includes(id) ? s.favorites.products.filter((x) => x !== id) : [...s.favorites.products, id],
          },
        })),

      water: {},
      setWater: (key, glasses) => set((s) => ({ water: { ...s.water, [key]: Math.max(0, Math.min(16, glasses)) } })),

      remindersOn: true,
      reminders: DEFAULT_REMINDERS,
      setRemindersOn: (on) => set({ remindersOn: on }),
      updateReminder: (id, patch) => set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      cart: [],
      promoCode: null,
      addToCart: (id, kind = "product", qty = 1) =>
        set((s) => {
          const found = s.cart.find((l) => l.id === id);
          return {
            cart: found ? s.cart.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { id, kind, qty }],
          };
        }),
      setQty: (id, qty) =>
        set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => l.id !== id) : s.cart.map((l) => (l.id === id ? { ...l, qty } : l)) })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((l) => l.id !== id) })),
      setPromo: (code) => set({ promoCode: code ? code.trim().toUpperCase() : null }),
      address: BLANK_ADDRESS,
      setAddress: (a) => set({ address: a }),
      orders: [],
      placeOrder: ({ delivery, slotLabel, instructions, payment }) => {
        const s = get();
        const t = cartTotals(s.cart, s.promoCode, s.student.verified, delivery);
        const order: Order = {
          id: `HB-${Math.floor(100000 + Math.random() * 900000)}`,
          placedAt: Date.now(),
          lines: s.cart.map((l) => ({ id: l.id, kind: l.kind, name: lineName(l), qty: l.qty, unitPrice: unitPrice(l) })),
          subtotal: t.subtotal,
          discount: t.discount,
          deliveryFee: t.fee,
          total: t.total,
          promoCode: t.promo.ok ? s.promoCode ?? undefined : undefined,
          delivery,
          slotLabel,
          address: s.address,
          instructions,
          payment,
          manualStep: 0,
        };
        set({ orders: [order, ...s.orders], cart: [], promoCode: null });
        return order;
      },
      advanceOrder: (id) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, manualStep: o.manualStep + 1 } : o)) })),

      chat: [],
      addChat: (m) => set((s) => ({ chat: [...s.chat, m].slice(-60) })),
      clearChat: () => set({ chat: [] }),
    }),
    {
      name: "hengstenberg-smart-nutrition-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile, student: s.student, plan: s.plan, favorites: s.favorites, water: s.water,
        remindersOn: s.remindersOn, reminders: s.reminders, cart: s.cart, promoCode: s.promoCode,
        address: s.address, orders: s.orders, chat: s.chat,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return { ...current, ...p, stack: p.profile ? [{ name: "home" }] : current.stack };
      },
    },
  ),
);

export const useRoute = () => useApp((s) => s.stack[s.stack.length - 1]);
