import { useEffect } from "react";
import { useApp } from "../store/useApp.ts";
import { dayKey } from "./dates.ts";

export const REMINDER_COPY: Record<string, { title: string; body: string; emoji: string }> = {
  meals: { title: "Meal times", body: "Time for a balanced meal — check today's plan.", emoji: "🍽️" },
  water: { title: "Drink water", body: "Stay hydrated — have a glass of water.", emoji: "💧" },
  planning: { title: "Weekly meal planning", body: "Plan next week's meals in 5 minutes.", emoji: "🗓️" },
  shopping: { title: "Grocery shopping", body: "Running low? Restock with 24/7 delivery.", emoji: "🛒" },
  goals: { title: "Nutrition goals", body: "Quick check-in: how did today go?", emoji: "🎯" },
};

/** Shows in-app reminder toasts while the app is open (demo of the reminder system). */
export function useReminderNotifications() {
  useEffect(() => {
    const fired = new Set<string>();
    const tick = () => {
      const s = useApp.getState();
      if (!s.profile || !s.remindersOn) return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const r of s.reminders) {
        const key = `${dayKey()}-${r.id}-${hhmm}`;
        if (r.enabled && r.time === hhmm && !fired.has(key)) {
          fired.add(key);
          const c = REMINDER_COPY[r.id];
          s.showToast(`${c.emoji} ${c.body}`);
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`Smart Nutrition · ${c.title}`, { body: c.body });
            } catch {
              /* some browsers only allow notifications from a service worker */
            }
          }
        }
      }
    };
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);
}
