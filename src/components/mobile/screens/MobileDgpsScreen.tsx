import { useMemo, useState } from "react";
import { Bluetooth, Crosshair, Radio } from "lucide-react";
import { SURVEY_ORIGIN } from "../../../data/treeSurveyData";
import { useMobileApp } from "../MobileAppContext";
import MobileChatBackButton from "../MobileChatBackButton";

export default function MobileDgpsScreen() {
  const {
    gnssConnected,
    gnssPoints,
    nextPointId,
    setNextPointId,
    connectGnss,
    disconnectGnss,
    captureGnssPoint,
    openOverlay,
  } = useMobileApp();

  const [liveAccuracy] = useState(0.09);
  const last = gnssPoints[0];

  const statusLabel = useMemo(() => {
    if (!gnssConnected) return "Rover idle";
    return `RTK fix · ±${liveAccuracy.toFixed(2)} m`;
  }, [gnssConnected, liveAccuracy]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <MobileChatBackButton />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A]">DGPS rover</p>
            <p className="text-[10px] text-slate-500">Connect rover · collect tree points with accuracy</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openOverlay("rover-settings")}
          className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600"
        >
          Settings
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className={`mb-3 rounded-xl border px-3 py-2.5 ${gnssConnected ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${gnssConnected ? "text-emerald-700" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]">Trimble R12</p>
                <p className="text-[10px] text-slate-500">{statusLabel}</p>
              </div>
            </div>
            {gnssConnected ? (
              <button
                type="button"
                onClick={disconnectGnss}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={connectGnss}
                className="inline-flex items-center gap-1 rounded-full bg-[#1A1A1A] px-2.5 py-1 text-[10px] font-medium text-white"
              >
                <Bluetooth className="h-3 w-3" />
                Connect rover
              </button>
            )}
          </div>
          {gnssConnected ? (
            <p className="mt-2 text-[10px] text-emerald-800">
              Baseline DGPS at first capture. Phone GNSS is flagged when rover is off.
            </p>
          ) : null}
        </div>

        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Next point ID
        </label>
        <input
          value={nextPointId}
          onChange={(e) => setNextPointId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
        />

        <button
          type="button"
          disabled={!gnssConnected}
          onClick={captureGnssPoint}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 py-2.5 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Collect point
        </button>

        {last ? (
          <p className="mb-2 text-[10px] text-slate-500">
            Last: {last.label} · {last.lat.toFixed(6)}, {last.lng.toFixed(6)} · ±{last.accuracyM.toFixed(2)} m
            · near {SURVEY_ORIGIN.lat.toFixed(2)}°N
          </p>
        ) : null}

        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Collected points
        </p>
        <div className="space-y-1.5">
          {gnssPoints.map((point) => (
            <div key={point.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-semibold">{point.label}</p>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium ${
                    point.synced ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {point.synced ? "Synced" : "Pending"}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
              </p>
              <p className="text-[10px] text-slate-500">
                Accuracy ±{point.accuracyM.toFixed(2)} m · {point.source} · {point.capturedAt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
