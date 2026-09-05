import { ArrowLeft } from "lucide-react";
import { useMobileApp } from "./MobileAppContext";

type Props = {
  onBack?: () => void;
  showLabel?: boolean;
  className?: string;
};

/** Shown when the user navigated here from the Chatbot tab — returns to chat on tap. */
export default function MobileChatBackButton({ onBack, showLabel = false, className = "" }: Props) {
  const { returnTab, returnToChat } = useMobileApp();
  if (returnTab !== "assist") return null;

  return (
    <button
      type="button"
      onClick={() => {
        onBack?.();
        returnToChat();
      }}
      className={`flex shrink-0 items-center gap-1 rounded-lg transition active:bg-slate-100 ${
        showLabel ? "px-1 py-1.5" : "p-1.5"
      } ${className}`}
      aria-label="Back to Chatbot"
    >
      <ArrowLeft className="h-4 w-4 text-slate-700" />
      {showLabel ? (
        <span className="text-[11px] font-medium text-slate-700">Chat</span>
      ) : null}
    </button>
  );
}
