# Hengstenberg Smart Nutrition

**Good food. A healthier you.**

An interactive, mobile-first prototype for a Hengstenberg consumer app. It combines AI nutrition guidance, personalised meal planning, product discovery, direct shopping with 24/7 delivery, and a Student Corner. It was built as a university innovation project.

> ⚠️ Prototype notice: product nutrition values, ingredients, prices, promotions, delivery and order tracking are **sample/demo data**. Nutrition guidance is general and **not medical advice**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

Click **"Try the demo profile (Emma, 22)"** on the welcome screen to jump straight into a pre-filled profile with a week of history. On a desktop browser the app shows inside a phone frame, next to a presenter panel that jumps to every step of the customer journey (it fills the cart or creates a demo order when a step needs one).

## Customer journey

Welcome → Create nutrition profile (4 steps) → Personalised dashboard → Product details (Overview / Nutrition / Ingredients / Usage) → Add to cart → Checkout with 24/7 delivery (ASAP or scheduled 2-hour slots, day or night) → Place demo order → Live order tracking (Order placed → Preparing → On the way → Delivered).

The AI Assistant, Student Corner, Meal Planner, Progress and Reminders screens are all reachable from the bottom navigation, the dashboard or the profile.

## Features

| Area | What works |
|---|---|
| Onboarding | Goal, personal data, diet, allergies, avoided ingredients, cooking time, budget, meals per day, student status. Editable later from Profile. |
| Dashboard | Greeting, goal, calorie ring and macros from completed meals, meal tracker, water tracker, goal-based product picks, reminders, active-order card, quick access. |
| AI assistant | Personalised answers (meals today, weight loss, fibre, 10-minute recipes, diet fit, vitamins and minerals, protein, budget, hydration). Shows recipe and product cards. Sends medical questions to a doctor or dietitian. |
| Products | 9 Hengstenberg products (Mildessa, KNAX, Red Cabbage with Apple, Beetroot, Altmeister vinegar…). Search and filters: All / Suitable for my goal / High fibre / Low calorie / Vegan / Low sugar. Allergy-aware. |
| Meal planner | Day and week views, replace meals, favourites, add products to meals, mark meals done, estimated daily totals, quick recipes. |
| Shopping | Cart with quantities, promo codes (`STARTER15`, `KNAX3`, `SNACK10`), student free delivery from €10, checkout with address, instructions, time slot and payment method. |
| Student Corner | University-email verification (demo code), demo promotions with Shop Now (adds to cart and applies the code), bundles, budget picks, student meals. |
| Progress & reminders | Daily completion, 7-day consistency chart, personal goals, nutrition overview. Configurable reminders with a master switch, shown in-app and optionally as browser notifications. |

All state (profile, plan, cart, orders, chat, reminders) is saved in `localStorage`, so a page reload keeps everything. **Profile → Reset app** clears it.

## AI integration (secure)

The browser never holds an API key. The client calls `POST /api/chat`:

- **Development:** `vite.config.ts` serves `/api/chat` with the same handler.
- **Production (Vercel):** `api/chat.ts` is a serverless function.
- **Handler:** `server/chat.ts` uses the official Anthropic SDK. Its system prompt contains the product catalogue and the user's profile, and it sets the guardrails (no diagnoses, no supplement advice).

To turn on live AI, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. On Vercel, set it as a project environment variable. Never prefix it with `VITE_`. Without a key the endpoint returns 503 and the app switches to the **offline demo assistant** (`src/lib/assistant.ts`), so the prototype works with no backend at all.

## Project structure

```
api/chat.ts                 Vercel serverless function (POST /api/chat)
server/chat.ts              Server-side AI handler (Anthropic SDK, key from env)
src/
  App.tsx                   Shell: phone frame, routing, bottom nav, toasts
  store/useApp.ts           Zustand store (persisted): navigation, profile, plan, cart, orders, chat
  data/                     products.ts, recipes.ts, promotions.ts (sample data)
  lib/                      nutrition targets, recommendations, pricing/promos, order status, demo assistant
  services/                 assistantService.ts (AI-first, demo fallback)
  components/               UI primitives, product/meal illustrations, cards, nav, presenter panel
  screens/                  One file per screen
```

### Extending to production

- **Product data:** replace `src/data/products.ts` with verified data from Hengstenberg (or an API). Every screen reads from it.
- **Photography:** products are drawn as SVG packshots (`ProductArt`). Drop licensed photos into `public/products/` and render them in `ProductArt` / the cards.
- **Auth and database:** the store's `partialize` list shows exactly what to sync. Swap `localStorage` for an API-backed store.
- **Commerce and delivery:** `placeOrder` / `orderStep` in the store and `src/lib/orders.ts` are the integration points for a real checkout, payment provider and delivery partner. Real 24/7 availability depends on location, partner stores and delivery capacity.

## Tech

React 19 · TypeScript · Tailwind CSS v4 (container queries for phone, tablet and desktop) · Zustand · lucide-react · Vite.
