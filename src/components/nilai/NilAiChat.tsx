import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Loader2, Map, Send, Sparkles, User } from "lucide-react";
import NilAiDownloadCard from "./NilAiDownloadCard";
import type { NilAiAttachment } from "../../lib/nilAiExport";
import type { NilAiFollowUp, NilAiTreeCard } from "../../data/nilAiDemo";
import { getFallbackTreePhotoUrl, HEALTH_COLORS } from "../../data/treeSurveyData";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: NilAiAttachment[];
  trees?: NilAiTreeCard[];
  followUps?: NilAiFollowUp[];
};

type Props = {
  messages: ChatMessage[];
  isThinking: boolean;
  onSubmit: (prompt: string) => void;
  headerAction?: ReactNode;
};

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function TreeResultCard({ tree }: { tree: NilAiTreeCard }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-2">
      <img
        src={tree.photoUrl}
        alt={`${tree.commonName} (${tree.species})`}
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
        onError={(e) => {
          const img = e.currentTarget;
          img.onerror = null;
          img.src = getFallbackTreePhotoUrl();
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[12px] font-semibold text-slate-900">
            {tree.label} · {tree.commonName}
          </p>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize text-white"
            style={{ backgroundColor: HEALTH_COLORS[tree.health] }}
          >
            {tree.health}
          </span>
        </div>
        <p className="truncate text-[10px] italic text-slate-500">{tree.species}</p>
        <p className="mt-0.5 text-[10px] text-slate-600">
          Height {tree.heightM} m · Canopy {tree.canopyDiameterM} m
        </p>
      </div>
    </div>
  );
}

function FollowUpChips({
  items,
  disabled,
  onSelect,
}: {
  items: NilAiFollowUp[];
  disabled: boolean;
  onSelect: (prompt: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.prompt)}
          className="rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-left text-[11px] font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function NilAiChat({ messages, isThinking, onSubmit, headerAction }: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || isThinking) return;
    setDraft("");
    onSubmit(value);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[#1A1A1A]">Tree AI</h2>
            <p className="truncate text-[11px] text-slate-500">Urban forestry intelligence</p>
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Map className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="max-w-[92%] space-y-2">
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  message.role === "user"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-100 bg-slate-50 text-slate-700"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="whitespace-pre-wrap">{renderMarkdownLite(message.content)}</div>
                ) : (
                  message.content
                )}
              </div>
              {message.trees?.length ? (
                <div className="space-y-1.5">
                  {message.trees.map((tree) => (
                    <TreeResultCard key={tree.id} tree={tree} />
                  ))}
                </div>
              ) : null}
              {message.attachments?.length ? (
                <div className="space-y-2">
                  {message.attachments.map((attachment) => (
                    <NilAiDownloadCard key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              ) : null}
              {message.role === "assistant" &&
              message.followUps?.length &&
              message.id === latestAssistantId &&
              !isThinking ? (
                <FollowUpChips items={message.followUps} disabled={isThinking} onSelect={onSubmit} />
              ) : null}
            </div>
            {message.role === "user" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Map className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analysing tree inventory…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            rows={2}
            placeholder="Or type a custom question about health, species, canopy, height…"
            className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isThinking}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send prompt"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
