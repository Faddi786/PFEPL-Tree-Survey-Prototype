import { useState } from "react";
import { ArrowLeft, Check, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { TREE_SURVEY_RECORDS } from "../../data/treeSurveyData";

export default function QrMeasurePage() {
  const sample = TREE_SURVEY_RECORDS[2];
  const [height, setHeight] = useState(sample.heightM);
  const [crown, setCrown] = useState(sample.crownSpreadM);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] p-3 lg:p-4">
      <main className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <Link
          to="/app"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to map
        </Link>
        <div className="mb-4 flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          <div>
            <h1 className="text-lg font-semibold">Height & crown from QR-tag scale</h1>
            <p className="text-xs text-slate-500">
              Photograph the tree with the mounted QR card in frame. The card is a known size; the platform converts pixels to metres. Species and health are not inferred here.
            </p>
          </div>
        </div>

        <img
          src={sample.photoUrl}
          alt="Tree with QR tag in frame"
          className="mb-4 h-48 w-full rounded-xl object-cover"
        />

        <p className="mb-3 text-xs text-slate-500">
          {sample.id} · QR {sample.qrTagId} · confidence {(sample.heightConfidence * 100).toFixed(0)}% height / {(sample.crownConfidence * 100).toFixed(0)}% crown
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            Height (m)
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => {
                setHeight(Number(e.target.value));
                setAccepted(false);
              }}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
            <span className="text-[10px] text-slate-400">Override allowed</span>
          </label>
          <label className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            Crown spread (m)
            <input
              type="number"
              step="0.1"
              value={crown}
              onChange={(e) => {
                setCrown(Number(e.target.value));
                setAccepted(false);
              }}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
            <span className="text-[10px] text-slate-400">Override allowed</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setAccepted(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white"
        >
          <Check className="h-4 w-4" />
          Accept and save to record
        </button>
        {accepted ? (
          <p className="mt-3 text-sm text-emerald-700">
            Saved: {height.toFixed(1)} m height, {crown.toFixed(1)} m crown on {sample.id}. Officer identity, timestamp and GNSS attached.
          </p>
        ) : null}
      </main>
    </div>
  );
}
