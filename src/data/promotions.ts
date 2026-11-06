/** Demo promotions and bundles — not real campaigns. */
export interface Bundle {
  id: string;
  name: string;
  description: string;
  items: { productId: string; qty: number }[];
  price: number;
  studentOnly?: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  badge: string;
  description: string;
  bundleId?: string;
  productIds?: string[];
  requiresStudent: boolean;
  tone: "green" | "red" | "cream";
}

export const bundles: Bundle[] = [
  {
    id: "student-starter-pack",
    name: "Student Starter Pack",
    description: "Sauerkraut, KNAX Gherkins, Red Cabbage & Beetroot — everything for a week of quick, healthy meals.",
    items: [
      { productId: "mildessa-sauerkraut", qty: 1 },
      { productId: "knax-gherkins", qty: 1 },
      { productId: "red-cabbage-apple", qty: 1 },
      { productId: "beetroot-slices", qty: 1 },
    ],
    price: 7.49,
    studentOnly: true,
  },
  {
    id: "healthy-snacking-set",
    name: "Healthy Snacking Set",
    description: "Gherkin Sticks, Pearl Onions & Mixed Pickles — crunchy, savoury and low in calories.",
    items: [
      { productId: "gherkin-sticks", qty: 1 },
      { productId: "pearl-onions", qty: 1 },
      { productId: "mixed-pickles", qty: 1 },
    ],
    price: 4.99,
  },
];

export const promotions: Promotion[] = [
  {
    id: "starter15",
    code: "STARTER15",
    title: "15% OFF Student Starter Pack",
    badge: "-15%",
    description: "Verified students save 15% on the Student Starter Pack.",
    bundleId: "student-starter-pack",
    requiresStudent: true,
    tone: "green",
  },
  {
    id: "knax3",
    code: "KNAX3",
    title: "Buy 2 + 1 Free",
    badge: "2+1",
    description: "Every third jar of KNAX Gherkins is on us.",
    productIds: ["knax-gherkins"],
    requiresStudent: false,
    tone: "red",
  },
  {
    id: "snack10",
    code: "SNACK10",
    title: "10% OFF Healthy Snacking Set",
    badge: "-10%",
    description: "Crunchy, low-calorie snacks for long study sessions.",
    bundleId: "healthy-snacking-set",
    requiresStudent: false,
    tone: "cream",
  },
];

export const bundleById = (id: string) => bundles.find((b) => b.id === id);
export const promotionByCode = (code: string) => promotions.find((p) => p.code === code.trim().toUpperCase());
