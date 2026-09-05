import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { getDprParcelsForDate } from "../../../data/mobileDprData";
import { TODAY_DPR_CREW } from "../../../data/mobileChatbot";
import { useMobileApp } from "../MobileAppContext";

export default function MobileDprDateDetailScreen() {
  const { dprSelectedDate, tab, closeDpr, openDprParcel } = useMobileApp();
  if (!dprSelectedDate) return null;

  const surveys = getDprParcelsForDate(dprSelectedDate);
  const [, , day] = dprSelectedDate.split("-");
  const displayDate = new Date(dprSelectedDate + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const totalTrees = surveys.reduce((s, p) => s + p.pointsCollected, 0);
  const isToday = (() => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return dprSelectedDate === iso;
  })();

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#F7F7F5]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={closeDpr}
          className="rounded-lg p-1.5 hover:bg-slate-100"
          aria-label={tab === "assist" ? "Back to Chatbot" : "Close DPR report"}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Tree survey · Day {Number(day)}</p>
          <p className="text-[10px] text-slate-500">{displayDate}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-2 gap-px bg-slate-200">
            <div className="bg-white px-3 py-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Zones</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{surveys.length}</p>
            </div>
            <div className="bg-white px-3 py-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Trees</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{totalTrees}</p>
            </div>
            {isToday
              ? TODAY_DPR_CREW.map((name) => (
                  <div key={name} className="bg-white px-3 py-2.5">
                    <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                      Surveyor
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-violet-800">{name}</p>
                  </div>
                ))
              : null}
          </div>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Trees surveyed
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[88px_minmax(0,1fr)_44px] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Zone</span>
            <span>Block</span>
            <span className="text-right">Trees</span>
          </div>
          {surveys.map((survey) => (
            <button
              key={survey.id}
              type="button"
              onClick={() => openDprParcel(survey.id)}
              className="grid w-full grid-cols-[88px_minmax(0,1fr)_44px] items-center gap-2 border-b border-slate-50 px-3 py-2.5 text-left text-[13px] last:border-0 active:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-1 font-semibold text-slate-900">
                <span>Zone {survey.parcelNumber}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </span>
              <span className="flex min-w-0 items-start gap-1 text-[12px] leading-snug text-slate-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-normal break-words">{survey.village}</span>
              </span>
              <span className="text-right font-medium tabular-nums text-slate-800">{survey.pointsCollected}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
