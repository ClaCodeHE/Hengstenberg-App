import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { useApp } from "../store/useApp.ts";
import { CartButton, cx } from "../components/ui.tsx";
import { RichText } from "../components/RichText.tsx";
import { ProductTile, RecipeRow } from "../components/cards.tsx";
import { productById } from "../data/products.ts";
import { recipeById } from "../data/recipes.ts";
import { STARTER_QUESTIONS } from "../lib/assistant.ts";
import { askAssistant, assistantMode } from "../services/assistantService.ts";
import { dayKey } from "../lib/dates.ts";
import { useDay } from "../lib/useToday.ts";
import { goalInfo } from "../lib/nutrition.ts";
import type { ChatMessage } from "../lib/types.ts";

const uid = () => Math.random().toString(36).slice(2, 10);

export function Assistant({ initialQuestion }: { initialQuestion?: string }) {
  const profile = useApp((s) => s.profile);
  const chat = useApp((s) => s.chat);
  const addChat = useApp((s) => s.addChat);
  const clearChat = useApp((s) => s.clearChat);
  const { entries } = useDay(dayKey());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTER_QUESTIONS);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    const scroller = endRef.current?.closest(".overflow-y-auto");
    if (scroller && (chat.length > 0 || busy)) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [chat.length, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const history = useApp.getState().chat;
    addChat({ id: uid(), role: "user", text: q, ts: Date.now() });
    setBusy(true);
    try {
      const r = await askAssistant(history, q, profile, entries.map((e) => e.recipeId));
      const msg: ChatMessage = { id: uid(), role: "assistant", text: r.text, productIds: r.productIds, recipeIds: r.recipeIds, source: r.source, ts: Date.now() };
      addChat(msg);
      setSuggestions(r.suggestions?.length ? r.suggestions : STARTER_QUESTIONS.filter((s) => s !== q).slice(0, 4));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      void send(initialQuestion);
    }
  }, [initialQuestion]);

  const mode = assistantMode();

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="sticky top-0 z-30 bg-cream/92 px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-forest text-fresh shadow-soft">
            <Sparkles size={20} />
            <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-fresh ring-2 ring-cream" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[17px] font-semibold leading-tight text-forest">AI Nutrition Assistant</h1>
            <p className="truncate text-[11.5px] text-ink-3">
              {mode === true ? "Live AI" : mode === false ? "Demo mode · predefined answers" : "Online"}
              {profile && ` · tailored to ${goalInfo(profile.goal).label.toLowerCase()}`}
            </p>
          </div>
          {chat.length > 0 && (
            <button aria-label="Clear conversation" title="Clear conversation" onClick={() => { clearChat(); setSuggestions(STARTER_QUESTIONS); }} className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-ink-3 shadow-soft hover:text-berry">
              <Trash2 size={17} />
            </button>
          )}
          <CartButton />
        </div>
      </header>

      <div className="flex-1 space-y-4 px-5 pt-2">
        <div className="flex items-start gap-2 rounded-2xl bg-sage/70 px-3.5 py-2.5 text-[11.5px] leading-snug text-forest/80">
          <ShieldCheck size={15} className="mt-px shrink-0 text-forest" />
          <span>General nutrition guidance only — not medical advice. For health conditions, deficiencies or supplements, please consult a doctor or registered dietitian.</span>
        </div>

        <Bubble role="assistant">
          <RichText
            text={`Hi${profile ? ` ${profile.name}` : ""}! I'm your personal nutrition assistant. ${profile ? `I'll use your profile — **${goalInfo(profile.goal).label.toLowerCase()}**, ${profile.cookTime.replace("under-", "under ").replace("-plus", "+")} min to cook${profile.isStudent ? ", student budget" : ""} — to personalise my answers.` : ""} What would you like to know?`}
          />
        </Bubble>

        {chat.map((m) => (
          <div key={m.id} className="space-y-2.5 animate-[fade-up_.3s_both]">
            <Bubble role={m.role} source={m.source}>
              {m.role === "assistant" ? <RichText text={m.text} /> : m.text}
            </Bubble>
            {m.recipeIds && m.recipeIds.length > 0 && (
              <div className="ml-9 space-y-2">
                {m.recipeIds.map((id) => recipeById(id)).filter(Boolean).map((r) => <RecipeRow key={r!.id} recipe={r!} />)}
              </div>
            )}
            {m.productIds && m.productIds.length > 0 && (
              <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto pb-1 pl-14 pr-5">
                {m.productIds.map((id) => productById(id)).filter(Boolean).map((p) => <ProductTile key={p!.id} product={p!} />)}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <Bubble role="assistant">
            <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 animate-bounce rounded-full bg-forest/40" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          </Bubble>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[92px] z-30 mt-3 bg-gradient-to-t from-cream via-cream to-cream/0 px-5 pb-2 pt-4">
        {!busy && (
          <div className="no-scrollbar -mx-5 mb-2.5 flex gap-2 overflow-x-auto px-5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold text-forest shadow-soft ring-1 ring-line hover:ring-fresh">
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-lift ring-1 ring-line focus-within:ring-2 focus-within:ring-fresh"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about food, recipes, products…" aria-label="Message the assistant" className="h-10 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3" />
          <button type="submit" disabled={!input.trim() || busy} aria-label="Send" className="grid size-10 place-items-center rounded-full bg-forest text-white transition active:scale-90 disabled:bg-sage-200 disabled:text-ink-3">
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, children, source }: { role: "user" | "assistant"; children: React.ReactNode; source?: "ai" | "demo" }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-[22px] rounded-br-md bg-forest px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-soft">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fresh text-forest"><Sparkles size={13} /></span>
      <div className={cx("max-w-[85%] rounded-[22px] rounded-bl-md bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink-2 shadow-soft")}>
        {children}
        {source && (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-3">{source === "ai" ? "AI generated" : "Demo answer"}</p>
        )}
      </div>
    </div>
  );
}
