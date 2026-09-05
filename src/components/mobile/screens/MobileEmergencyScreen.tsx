import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Mail, Phone, Siren, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import MobileEmergencyMap from "../MobileEmergencyMap";
import { useMobileApp } from "../MobileAppContext";

type Phase = "idle" | "countdown" | "active";

const STATUS_MESSAGES = [
  { id: "mail", text: "Alerted through mail to every station", icon: Mail, delay: 0.4 },
  { id: "phone", text: "Alerted through phone notification to every station", icon: Phone, delay: 1.2 },
  { id: "call", text: "Calling stations for alert", icon: Siren, delay: 2.0 },
];

const SLIDE_THRESHOLD = 0.85;

export default function MobileEmergencyScreen() {
  const { returnTab, returnToChat, setTab } = useMobileApp();
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [slideX, setSlideX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const countdownTimer = useRef<number | null>(null);

  const maxSlide = useCallback(() => {
    const track = trackRef.current;
    return track ? track.clientWidth - 48 : 200;
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownTimer.current) {
      window.clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setPhase("idle");
    setCountdown(3);
    setSlideX(0);
  }, []);

  const startCountdown = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);
    let remaining = 3;
    countdownTimer.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownTimer.current) window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        setPhase("active");
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    if (phase !== "idle") return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || phase !== "idle") return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - 24, maxSlide()));
    setSlideX(x);
  }

  function handlePointerUp() {
    if (!dragging || phase !== "idle") return;
    setDragging(false);
    const threshold = maxSlide() * SLIDE_THRESHOLD;
    if (slideX >= threshold) {
      setSlideX(maxSlide());
      startCountdown();
    } else {
      setSlideX(0);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => {
            cancelCountdown();
            if (returnTab === "assist") {
              returnToChat();
            } else {
              setTab("home");
            }
          }}
          className="rounded-lg p-1.5 hover:bg-slate-100"
          aria-label={returnTab === "assist" ? "Back to Chatbot" : "Back to Home"}
        >
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Station alert</p>
          <p className="text-[10px] text-slate-500">Emergency field notification</p>
        </div>
      </div>

      <div
        className={`relative min-h-0 flex-1 ${
          phase === "active" ? "overflow-hidden" : "overflow-y-auto p-4"
        }`}
      >
        <AnimatePresence mode="wait">
          {phase === "idle" || phase === "countdown" ? (
            <motion.div
              key="slider"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <p className="text-sm font-semibold text-rose-800">Emergency field alert</p>
                </div>
                <p className="text-xs text-rose-700/80">
                  Slide to notify all revenue stations in your district. Use only in genuine emergencies.
                </p>
              </div>

              {phase === "countdown" ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center rounded-2xl border border-amber-200 bg-amber-50/80 p-6"
                >
                  <p className="text-4xl font-bold tabular-nums text-amber-700">{countdown}</p>
                  <p className="mt-2 text-sm text-amber-800">Alert firing in…</p>
                  <button
                    type="button"
                    onClick={cancelCountdown}
                    className="mt-4 flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-medium text-amber-800 transition active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel alert
                  </button>
                </motion.div>
              ) : (
                <div
                  ref={trackRef}
                  className="relative h-12 overflow-hidden rounded-full border border-rose-300 bg-rose-100"
                >
                  <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-rose-600/70">
                    Slide to trigger emergency →
                  </p>
                  <motion.div
                    className="absolute left-1 top-1 flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-rose-500 text-white shadow-md active:cursor-grabbing"
                    style={{ x: slideX }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    <Siren className="h-4 w-4" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col pt-[2%]"
            >
              <MobileEmergencyMap className="min-h-0 flex-1" />

              <div className="pointer-events-none absolute inset-0 flex flex-col">
                <div className="p-3">
                  <span className="inline-flex rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
                    ALERT ACTIVE
                  </span>
                </div>

                <div className="mt-auto space-y-2 p-3 pb-4">
                  {STATUS_MESSAGES.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: msg.delay }}
                      className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-sm"
                    >
                      <msg.icon className="h-4 w-4 shrink-0 text-rose-500" />
                      <p className="text-xs font-medium text-[#1A1A1A]">{msg.text}</p>
                      <motion.span
                        className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
