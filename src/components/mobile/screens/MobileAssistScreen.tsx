import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SUGGESTED_CHIPS,
  answerChat,
  buildWelcomeMessages,
  type ChatAction,
  type ChatMessage,
  type DprChatBlock,
  type InfoTableBlock,
  type TreeChatField,
  type TreeChatBlock,
} from "../../../data/mobileChatbot";
import { playChatTing } from "../../../lib/chatTing";
import { useMobileApp } from "../MobileAppContext";

function newId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function FieldGrid({ fields }: { fields: TreeChatField[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {fields.map((field) => (
        <div key={field.label} className="flex items-baseline justify-between gap-3 px-3 py-2">
          <p className="shrink-0 text-[11px] font-semibold text-slate-500">{field.label}</p>
          <p className="min-w-0 text-right text-[13px] font-semibold capitalize leading-snug text-slate-900">
            {field.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function TreeCard({ block }: { block: TreeChatBlock }) {
  return (
    <div className="w-full overflow-hidden text-left">
      <div className="px-3 pb-2 pt-0.5">
        <p className="text-[14px] font-semibold text-slate-900">{block.title}</p>
        {block.subtitle ? (
          <p className="mt-0.5 text-[11px] text-slate-500">{block.subtitle}</p>
        ) : null}
      </div>
      <FieldGrid fields={block.fields} />
      {block.note ? (
        <p className="border-t border-slate-100 px-3 py-2 text-[12px] text-slate-600">
          <span className="font-semibold text-slate-500">Note · </span>
          {block.note}
        </p>
      ) : null}
    </div>
  );
}

function InfoCard({ block }: { block: InfoTableBlock }) {
  const cols = block.columns ?? [];
  const rows = block.rows ?? [];
  const colTemplate = cols
    .map((_, i) => {
      if (cols.length === 3 && i === 0) return "minmax(0,1.35fr)";
      if (cols.length === 3 && i === 1) return "minmax(0,1fr)";
      if (i === cols.length - 1) return "48px";
      return "minmax(0,1fr)";
    })
    .join(" ");

  return (
    <div className="w-full overflow-hidden text-left">
      <div className="px-3 pb-2 pt-0.5">
        <p className="text-[14px] font-semibold text-slate-900">{block.title}</p>
        {block.subtitle ? (
          <p className="mt-0.5 text-[11px] text-slate-500">{block.subtitle}</p>
        ) : null}
        {block.summary ? (
          <p className="mt-1 text-[12px] font-medium text-slate-700">{block.summary}</p>
        ) : null}
      </div>

      {block.fields?.length ? <FieldGrid fields={block.fields} /> : null}

      {cols.length && rows.length ? (
        <div>
          <div
            className="grid gap-2 border-y border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            style={{ gridTemplateColumns: colTemplate }}
          >
            {cols.map((col) => (
              <span
                key={col.key}
                className={col.align === "right" ? "text-right" : "truncate"}
              >
                {col.label}
              </span>
            ))}
          </div>
          <div className={rows.length > 5 ? "max-h-[180px] overflow-y-auto overscroll-contain" : ""}>
            {rows.map((row, idx) => (
              <div
                key={`${block.title}-${idx}`}
                className="grid gap-2 border-b border-slate-50 px-3 py-2.5 text-[13px] last:border-0"
                style={{ gridTemplateColumns: colTemplate }}
              >
                {cols.map((col, colIdx) => (
                  <span
                    key={col.key}
                    className={`${col.align === "right" ? "text-right tabular-nums" : "whitespace-normal break-words leading-snug"} ${
                      colIdx === 0 ? "font-semibold text-slate-900" : "capitalize text-slate-700"
                    }`}
                  >
                    {row[col.key]}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DprCard({
  block,
  onOpenDay,
}: {
  block: DprChatBlock;
  onOpenDay: (date: string) => void;
}) {
  const scrollable = block.tableRows.length > 6;
  const primaryDate = block.tableRows[0]?.date;
  const hasSurveyor = block.tableRows.some((row) => row.surveyor);
  const gridCols = hasSurveyor
    ? "grid-cols-[28px_minmax(0,1.1fr)_40px_34px_minmax(0,1fr)]"
    : "grid-cols-[28px_minmax(0,1.2fr)_44px_40px]";

  function openDay(date: string, event: React.MouseEvent | React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    onOpenDay(date);
  }

  return (
    <div className="w-full text-left">
      <p className="px-3 pb-2 pt-0.5 text-[14px] font-semibold text-slate-900">{block.title}</p>

      <div
        className={`grid ${gridCols} gap-2 border-y border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500`}
      >
        <span>Day</span>
        <span className="truncate">Block</span>
        <span className="text-right">Trees</span>
        <span className="text-right">Pts</span>
        {hasSurveyor ? <span className="truncate">Surveyor</span> : null}
      </div>
      <div className={scrollable ? "max-h-[180px] overflow-y-auto overscroll-contain" : ""}>
        {block.tableRows.map((row, idx) => (
          <button
            key={`${row.date}-${row.surveyor ?? idx}`}
            type="button"
            onClick={(event) => openDay(row.date, event)}
            className={`grid w-full min-h-[42px] touch-manipulation ${gridCols} gap-2 border-b border-slate-50 px-3 py-2.5 text-left text-[13px] transition last:border-0 active:bg-slate-100 ${
              row.highlight ? "bg-emerald-50/60" : ""
            }`}
          >
            <span className="pointer-events-none font-semibold tabular-nums text-slate-900">
              {row.day}
            </span>
            <span className="pointer-events-none whitespace-normal break-words leading-snug text-slate-700">
              {row.location}
            </span>
            <span className="pointer-events-none text-right font-medium tabular-nums text-slate-800">
              {row.trees}
            </span>
            <span className="pointer-events-none text-right font-medium tabular-nums text-slate-800">
              {row.points}
            </span>
            {hasSurveyor ? (
              <span className="pointer-events-none truncate font-semibold text-violet-800">
                {row.surveyor ?? "—"}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {primaryDate ? (
        <div className="px-3 pb-1 pt-2.5">
          <button
            type="button"
            onClick={(event) => openDay(primaryDate, event)}
            className="w-full rounded-full border border-emerald-200 bg-emerald-50 py-2 text-[12px] font-semibold text-emerald-800 transition active:bg-emerald-100"
          >
            Open detailed report →
          </button>
        </div>
      ) : null}
    </div>
  );
}

const bubbleTransition = {
  type: "spring" as const,
  stiffness: 520,
  damping: 18,
  mass: 0.55,
};

function MessageBubble({
  msg,
  onAction,
  onOpenDpr,
}: {
  msg: ChatMessage;
  onAction: (action: ChatAction) => void;
  onOpenDpr: (date: string) => void;
}) {
  const isUser = msg.role === "user";
  const hasCard = Boolean(msg.dpr || msg.tree || msg.info);

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        scale: 0.2,
        y: 10,
      }}
      animate={{
        opacity: 1,
        scale: [0.2, 1.08, 0.97, 1],
        y: 0,
      }}
      transition={{
        opacity: { duration: 0.12 },
        scale: { duration: 0.38, times: [0, 0.45, 0.75, 1], ease: "easeOut" },
        y: bubbleTransition,
      }}
      style={{
        transformOrigin: isUser ? "bottom right" : "bottom left",
      }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[90%] overflow-hidden rounded-2xl shadow-sm ${
          isUser
            ? "rounded-br-md bg-emerald-700 px-3 py-2 text-white"
            : hasCard
              ? "w-full rounded-bl-md border border-slate-200 bg-white py-2 text-slate-800"
              : "rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-slate-800"
        }`}
      >
        {msg.text ? (
          <p
            className={`whitespace-pre-wrap text-[12px] leading-relaxed ${
              hasCard ? "px-2.5 pb-1.5" : ""
            }`}
          >
            {msg.text}
          </p>
        ) : null}
        {msg.tree ? <TreeCard block={msg.tree} /> : null}
        {msg.info ? <InfoCard block={msg.info} /> : null}
        {msg.dpr ? <DprCard block={msg.dpr} onOpenDay={onOpenDpr} /> : null}
        {msg.role === "assistant" && msg.actions?.length ? (
          <div className={`mt-2 flex flex-wrap gap-1.5 ${hasCard ? "px-2.5" : ""}`}>
            {msg.actions.map((action) => (
              <button
                key={`${msg.id}-${action.label}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800 transition active:bg-emerald-100"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function MobileAssistScreen() {
  const {
    packets,
    gnssPoints,
    navigateFromChat,
    openDprDate,
    requestNavigateToTree,
  } = useMobileApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [waiting, setWaiting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const replyTimer = useRef<number | null>(null);
  const welcomeTimer = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Pop today's DPR when Chatbot is opened (not pre-rendered).
  useEffect(() => {
    welcomeTimer.current = window.setTimeout(() => {
      playChatTing();
      setMessages(buildWelcomeMessages());
      welcomeTimer.current = null;
    }, 450);
    return () => {
      if (welcomeTimer.current) window.clearTimeout(welcomeTimer.current);
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
    };
  }, []);

  function handleActionClick(action: ChatAction) {
    if (action.type === "openDprDate") {
      openDprDate(action.date);
      return;
    }
    if (action.type === "navigateTree") {
      requestNavigateToTree(action.treeId);
      navigateFromChat("map");
      return;
    }
    navigateFromChat(action.tab);
  }

  function submitQuery(raw: string) {
    const text = raw.trim();
    if (!text || waiting) return;

    const userMsg: ChatMessage = { id: newId(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setWaiting(true);

    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      const reply = answerChat(text, {
        packets,
        pendingGnssCount: gnssPoints.filter((p) => !p.synced).length,
      });
      const assistantMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        text: reply.text,
        dpr: reply.dpr,
        tree: reply.tree,
        info: reply.info,
        actions: reply.actions,
      };
      playChatTing();
      setMessages((prev) => [...prev, assistantMsg]);
      setWaiting(false);
      replyTimer.current = null;
    }, 2000);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F7F7F5]">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-lg leading-none">
          🤖
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Chatbot</p>
          <p className="text-[10px] text-slate-500">DPR · trees · sync</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onAction={handleActionClick}
              onOpenDpr={openDprDate}
            />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-3 pb-2 pt-2">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Suggestions
        </p>
        <div className="mb-2 grid grid-cols-2 gap-1.5">
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => submitQuery(chip)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[9px] font-medium leading-snug text-slate-700 transition active:bg-slate-100"
            >
              {chip}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitQuery(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about DPR, T-327, sync…"
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || waiting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition enabled:active:scale-95 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
