import { useEffect, useRef } from "react";
import { useApp, useRoute } from "./store/useApp.ts";
import { BottomNav, NAV_SCREENS } from "./components/BottomNav.tsx";
import { Toast } from "./components/Toast.tsx";
import { PresenterPanel } from "./components/PresenterPanel.tsx";
import { useReminderNotifications } from "./lib/useReminders.ts";
import { Welcome } from "./screens/Welcome.tsx";
import { Onboarding } from "./screens/Onboarding.tsx";
import { Home } from "./screens/Home.tsx";
import { Products } from "./screens/Products.tsx";
import { ProductDetail } from "./screens/ProductDetail.tsx";
import { Assistant } from "./screens/Assistant.tsx";
import { Student } from "./screens/Student.tsx";
import { ProfileScreen } from "./screens/Profile.tsx";
import { Planner } from "./screens/Planner.tsx";
import { RecipeDetail } from "./screens/RecipeDetail.tsx";
import { Cart } from "./screens/Cart.tsx";
import { Checkout } from "./screens/Checkout.tsx";
import { OrderTracking } from "./screens/OrderTracking.tsx";
import { Orders } from "./screens/Orders.tsx";
import { Progress } from "./screens/Progress.tsx";
import { Reminders } from "./screens/Reminders.tsx";

function Screen() {
  const route = useRoute();
  const p = route.params ?? {};
  switch (route.name) {
    case "welcome": return <Welcome />;
    case "onboarding": return <Onboarding edit={p.edit === "1"} />;
    case "home": return <Home />;
    case "products": return <Products initialFilter={p.filter} />;
    case "product": return <ProductDetail id={p.id} />;
    case "assistant": return <Assistant initialQuestion={p.q} />;
    case "student": return <Student />;
    case "profile": return <ProfileScreen />;
    case "planner": return <Planner />;
    case "recipe": return <RecipeDetail id={p.id} />;
    case "cart": return <Cart />;
    case "checkout": return <Checkout />;
    case "order": return <OrderTracking id={p.id} />;
    case "orders": return <Orders />;
    case "progress": return <Progress />;
    case "reminders": return <Reminders />;
  }
}

export default function App() {
  const route = useRoute();
  const depth = useApp((s) => s.stack.length);
  const scroller = useRef<HTMLDivElement>(null);
  const withNav = NAV_SCREENS.includes(route.name);
  useReminderNotifications();

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [route, depth]);

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top_left,#f4f1e6,transparent_55%),radial-gradient(ellipse_at_bottom_right,#d9e6d3,transparent_50%)] lg:flex lg:items-center lg:justify-center lg:gap-16 lg:p-8">
      <PresenterPanel />
      <div
        id="phone"
        className="@container relative mx-auto h-[100dvh] w-full max-w-[760px] overflow-hidden bg-cream md:shadow-lift lg:h-[min(880px,calc(100dvh-4rem))] lg:w-[404px] lg:shrink-0 lg:rounded-[52px] lg:border-[11px] lg:border-[#14201a] lg:shadow-[0_40px_80px_-20px_rgba(16,61,43,0.45)]"
      >
        {/* device notch on desktop */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-[70] hidden h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-[#14201a] lg:block" />
        <div ref={scroller} key={`${route.name}-${depth}`} className="no-scrollbar h-full overflow-y-auto overflow-x-hidden lg:pt-4">
          <div className={withNav ? "pb-32" : ""}>
            <Screen />
          </div>
        </div>
        {withNav && <BottomNav />}
        <Toast withNav={withNav} />
      </div>
    </div>
  );
}
