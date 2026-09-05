import { useMemo, useState } from "react";
import { QrCode } from "lucide-react";
import { TREE_SURVEY_RECORDS, type TreeHealthStatus, type TreeRecord } from "../../../data/treeSurveyData";
import type { EncroachmentStatus } from "../../../data/greenwatch";
import { useMobileApp } from "../MobileAppContext";
import MobileChatBackButton from "../MobileChatBackButton";

export default function MobileCaptureScreen() {
  const { pushIslandNotification, gnssConnected } = useMobileApp();
  const [scanned, setScanned] = useState<TreeRecord | null>(null);
  const [query, setQuery] = useState("");

  const preview = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TREE_SURVEY_RECORDS[0];
    return (
      TREE_SURVEY_RECORDS.find(
        (t) => t.qrTagId.toLowerCase() === q || t.id.toLowerCase() === q || t.qrTagId.toLowerCase().includes(q),
      ) ?? TREE_SURVEY_RECORDS[0]
    );
  }, [query]);

  if (!scanned) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
          <MobileChatBackButton />
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Capture</p>
            <p className="text-[10px] text-slate-500">Scan QR first, then fill the field form</p>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50">
            <QrCode className="h-16 w-16 text-emerald-800" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan or type QR e.g. GW-PUN-000001"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
            <p className="font-semibold">
              {preview.id} · {preview.commonName}
            </p>
            <p className="mt-1 font-mono text-[10px] text-emerald-800">{preview.qrTagId}</p>
            <p className="mt-2 text-slate-600">
              {preview.range} · {preview.beat} · {preview.compartment}
            </p>
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-[#1A1A1A] py-2 text-xs font-medium text-white"
            onClick={() => {
              setScanned(preview);
              pushIslandNotification({
                title: "QR check-in",
                subtitle: `${preview.qrTagId} opened`,
                icon: "check",
              });
            }}
          >
            Scan QR · open form
          </button>
        </div>
      </div>
    );
  }

  return (
    <FieldSurveyForm
      tree={scanned}
      gnssConnected={gnssConnected}
      onRescan={() => setScanned(null)}
      onSave={() => {
        pushIslandNotification({
          title: "Survey queued",
          subtitle: "Offline until sync",
          icon: "check",
        });
        setScanned(null);
      }}
    />
  );
}

function FieldSurveyForm({
  tree,
  gnssConnected,
  onRescan,
  onSave,
}: {
  tree: TreeRecord;
  gnssConnected: boolean;
  onRescan: () => void;
  onSave: () => void;
}) {
  const [commonName, setCommonName] = useState(tree.commonName);
  const [species, setSpecies] = useState(tree.species);
  const [height, setHeight] = useState(tree.heightM);
  const [crown, setCrown] = useState(tree.crownSpreadM);
  const [health, setHealth] = useState<TreeHealthStatus>(tree.health);
  const [pest, setPest] = useState("");
  const [lean, setLean] = useState("None");
  const [decay, setDecay] = useState("None");
  const [healthNote, setHealthNote] = useState("");
  const [encroachment, setEncroachment] = useState<EncroachmentStatus>(tree.encroachmentStatus);
  const [encroachNote, setEncroachNote] = useState("");
  const [waterMethod, setWaterMethod] = useState("Tanker");
  const [waterQty, setWaterQty] = useState("");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <MobileChatBackButton />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A]">{tree.id}</p>
            <p className="truncate font-mono text-[10px] text-emerald-800">{tree.qrTagId}</p>
          </div>
        </div>
        <button type="button" onClick={onRescan} className="text-[10px] font-medium text-slate-500">
          Rescan
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        <p className="text-[10px] text-slate-500">
          {tree.range} · {tree.beat} · {tree.compartment} · GNSS {gnssConnected ? "RTK rover" : "phone (flagged)"}
        </p>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Species confirmation</p>
          <label className="mb-2 block">
            Common name
            <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={commonName} onChange={(e) => setCommonName(e.target.value)} />
          </label>
          <label className="block">
            Scientific name
            <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={species} onChange={(e) => setSpecies(e.target.value)} />
          </label>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Height & canopy (QR-tag scale)
          </p>
          <p className="mb-2 text-[10px] text-slate-500">
            Photograph with QR card in frame. Accept or override. Confidence {(tree.heightConfidence * 100).toFixed(0)}%.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label>
              Height (m)
              <input
                type="number"
                step="0.1"
                className="mt-1 w-full rounded-md border px-2 py-1.5"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </label>
            <label>
              Canopy diameter (m)
              <input
                type="number"
                step="0.1"
                className="mt-1 w-full rounded-md border px-2 py-1.5"
                value={crown}
                onChange={(e) => setCrown(Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Health assessment</p>
          <div className="mb-2 flex gap-1">
            {(["healthy", "stressed", "diseased"] as const).map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setHealth(band)}
                className={`flex-1 rounded-full py-1 text-[10px] font-medium capitalize ${
                  health === band ? "bg-[#1A1A1A] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {band}
              </button>
            ))}
          </div>
          <label className="mb-2 block">
            Pest / disease
            <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={pest} onChange={(e) => setPest(e.target.value)} placeholder="Checklist / signs" />
          </label>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label>
              Lean
              <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={lean} onChange={(e) => setLean(e.target.value)} />
            </label>
            <label>
              Decay
              <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={decay} onChange={(e) => setDecay(e.target.value)} />
            </label>
          </div>
          <label className="block">
            Note + photo required
            <textarea className="mt-1 w-full rounded-md border px-2 py-1.5" rows={2} value={healthNote} onChange={(e) => setHealthNote(e.target.value)} />
          </label>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Encroachment</p>
          <div className="mb-2 flex gap-1">
            {(["none", "flagged", "resolved"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setEncroachment(status)}
                className={`flex-1 rounded-full py-1 text-[10px] font-medium capitalize ${
                  encroachment === status ? "bg-[#1A1A1A] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <input
            className="w-full rounded-md border px-2 py-1.5"
            placeholder="Category / description"
            value={encroachNote}
            onChange={(e) => setEncroachNote(e.target.value)}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Watering log</p>
          <div className="grid grid-cols-2 gap-2">
            <label>
              Method
              <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={waterMethod} onChange={(e) => setWaterMethod(e.target.value)} />
            </label>
            <label>
              Quantity
              <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={waterQty} onChange={(e) => setWaterQty(e.target.value)} placeholder="e.g. 20 L" />
            </label>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Next due date is computed from the plantation cycle after save.</p>
        </section>

        <button type="button" onClick={onSave} className="w-full rounded-full bg-emerald-700 py-2.5 text-xs font-semibold text-white">
          Accept & queue for sync
        </button>
      </div>
    </div>
  );
}
