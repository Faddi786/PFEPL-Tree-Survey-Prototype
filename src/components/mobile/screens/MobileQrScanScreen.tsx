import { useState } from "react";
import { QrCode } from "lucide-react";
import { TREE_SURVEY_RECORDS } from "../../../data/treeSurveyData";
import { useMobileApp } from "../MobileAppContext";
import MobileChatBackButton from "../MobileChatBackButton";

export default function MobileQrScanScreen() {
  const { setTab, pushIslandNotification } = useMobileApp();
  const [query, setQuery] = useState("");
  const tree = TREE_SURVEY_RECORDS.find(
    (t) =>
      t.qrTagId.toLowerCase() === query.trim().toLowerCase() ||
      t.id.toLowerCase() === query.trim().toLowerCase(),
  ) ?? TREE_SURVEY_RECORDS[0];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <MobileChatBackButton />
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">QR scan</p>
          <p className="text-[10px] text-slate-500">Opens the tree record offline</p>
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
          <p className="font-semibold">{tree.id} · {tree.commonName}</p>
          <p className="mt-1 font-mono text-[10px] text-emerald-800">{tree.qrTagId}</p>
          <p className="mt-2 text-slate-600">
            {tree.range} · {tree.beat} · Health {tree.health} · Encroachment {tree.encroachmentStatus}
          </p>
        </div>
        <button
          type="button"
          className="w-full rounded-full bg-[#1A1A1A] py-2 text-xs font-medium text-white"
          onClick={() => {
            pushIslandNotification({
              title: "Patrol check-in",
              subtitle: `${tree.qrTagId} · GNSS stored`,
              icon: "check",
            });
            setTab("capture");
          }}
        >
          Check in · continue to forms
        </button>
      </div>
    </div>
  );
}
