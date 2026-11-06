export type Goal = "weight-loss" | "muscle-gain" | "energy" | "balanced" | "digestive" | "wellness";
export type Gender = "female" | "male" | "diverse" | "unspecified";
export type Activity = "low" | "moderate" | "high";
export type Diet = "none" | "vegetarian" | "vegan" | "high-protein" | "low-calorie" | "gluten-free";
export type Allergen = "gluten" | "dairy" | "eggs" | "nuts" | "soy" | "fish" | "mustard" | "celery" | "sesame" | "sulphites";
export type CookTime = "under-10" | "10-20" | "20-40" | "40-plus";
export type Budget = "low" | "medium" | "high";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface Profile {
  name: string;
  occupation: string;
  goal: Goal;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  diets: Diet[];
  allergies: Allergen[];
  avoid: string[];
  cookTime: CookTime;
  budget: Budget;
  mealsPerDay: number;
  isStudent: boolean;
}

export type ProductTag = "high-fibre" | "low-calorie" | "vegan" | "vegetarian" | "low-sugar" | "gluten-free" | "low-fat" | "fermented";

export interface Nutrition {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturatedFat: number;
  carbs: number;
  sugar: number;
  fibre: number;
  protein: number;
  salt: number;
}

export type Container = "jar" | "tall-jar" | "pouch" | "bottle";

export interface ProductArtSpec {
  container: Container;
  lid: string;
  label: string;
  labelText: string;
  accent: string;
  fill: string;
  fillDetail: string;
  pattern: "shreds" | "gherkins" | "slices" | "onions" | "mixed" | "liquid" | "sticks";
  bg: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  short: string;
  description: string;
  size: string;
  price: number;
  category: "Sauerkraut" | "Pickles" | "Vegetables" | "Vinegar";
  tags: ProductTag[];
  goals: Goal[];
  highlights: string[];
  benefits: string[];
  nutrition: Nutrition;
  servingG: number;
  vitamins: string;
  ingredients: string;
  allergens: Allergen[];
  usage: string[];
  pairings: string[];
  recipeIds: string[];
  art: ProductArtSpec;
  rating: number;
}

export interface Recipe {
  id: string;
  name: string;
  slot: MealSlot;
  minutes: number;
  costEur: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  tags: Diet[];
  allergens: Allergen[];
  ingredients: string[];
  steps: string[];
  productIds: string[];
  colors: string[];
  student?: boolean;
}

export interface CartLine {
  id: string; // product id or bundle id
  kind: "product" | "bundle";
  qty: number;
}

export type DeliveryMode = "asap" | "scheduled";
export type PaymentMethod = "card" | "paypal" | "applepay" | "klarna";

export interface Address {
  name: string;
  street: string;
  city: string;
  zip: string;
  phone: string;
}

export interface OrderLine {
  id: string;
  kind: "product" | "bundle";
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  placedAt: number;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  delivery: DeliveryMode;
  slotLabel?: string;
  address: Address;
  instructions: string;
  payment: PaymentMethod;
  /** Demo only: number of manual "simulate next step" advances. */
  manualStep: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  productIds?: string[];
  recipeIds?: string[];
  source?: "ai" | "demo";
  ts: number;
}

export interface ReminderSetting {
  id: "meals" | "water" | "planning" | "shopping" | "goals";
  enabled: boolean;
  time: string; // HH:MM
  days: string; // label
}
