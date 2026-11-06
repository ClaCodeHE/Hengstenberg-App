import { useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { Button, DemoNote, Toggle, TopBar, cx } from "../components/ui.tsx";
import { REMINDER_COPY } from "../lib/useReminders.ts";

export function Reminders() {
  const on = useApp((s) => s.remindersOn);
  const setOn = useApp((s) => s.setRemindersOn);
  const reminders = useApp((s) => s.reminders);
  const update = useApp((s) => s.updateReminder);
  const toast = useApp((s) => s.showToast);
  const [perm, setPerm] = useState<string>(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") toast("Browser notifications enabled");
  };

  return (
    <div>
      <TopBar title="Smart reminders" />
      <div className="space-y-4 px-5">
        <section className={cx("flex items-center gap-3 rounded-3xl p-4 shadow-soft", on ? "bg-forest text-white" : "bg-white")}>
          <span className={cx("grid size-11 place-items-center rounded-2xl", on ? "bg-white/12 text-fresh" : "bg-sage text-ink-3")}>{on ? <BellRing size={20} /> : <BellOff size={20} />}</span>
          <div className="flex-1">
            <p className="text-[15px] font-bold">Reminders {on ? "on" : "off"}</p>
            <p className={cx("text-[12px]", on ? "text-white/65" : "text-ink-3")}>Turn everything off with one tap.</p>
          </div>
          <Toggle on={on} onChange={setOn} label="All reminders" />
        </section>

        <div className={cx("space-y-2.5 transition-opacity", !on && "pointer-events-none opacity-45")} aria-disabled={!on}>
          {reminders.map((r) => {
            const c = REMINDER_COPY[r.id];
            return (
              <div key={r.id} className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-cream text-xl">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-ink">{c.title}</p>
                    <p className="text-[12px] leading-snug text-ink-3">{c.body}</p>
                  </div>
                  <Toggle on={r.enabled} onChange={(v) => update(r.id, { enabled: v })} label={c.title} />
                </div>
                {r.enabled && (
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-2">
                      Time
                      <input type="time" value={r.time} onChange={(e) => update(r.id, { time: e.target.value })} className="rounded-xl bg-cream px-2.5 py-1.5 text-[13px] font-bold text-forest outline-none ring-fresh focus:ring-2" />
                    </label>
                    <select value={r.days} onChange={(e) => update(r.id, { days: e.target.value })} aria-label={`${c.title} frequency`} className="ml-auto rounded-xl bg-cream px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-2 outline-none">
                      {["Daily", "Weekdays", "Every 2 hours", "Daily check-in", "Sundays", "Fridays", "Weekly"].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="text-[14px] font-bold text-ink">Phone notifications</p>
          <p className="mt-0.5 text-[12px] text-ink-3">
            {perm === "granted" ? "Enabled — you'll also get browser notifications while the app is open." : perm === "denied" ? "Blocked in your browser settings." : perm === "unsupported" ? "Not supported in this browser." : "Allow notifications so reminders reach you outside the app tab."}
          </p>
          {perm === "default" && <Button size="sm" className="mt-3" onClick={askPermission}>Enable notifications</Button>}
        </section>
        <DemoNote>Prototype: reminders appear as in-app notifications while the app is open. Push notifications can be added with a backend later.</DemoNote>
      </div>
    </div>
  );
}
