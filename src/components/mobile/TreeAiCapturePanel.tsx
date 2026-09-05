import { useState } from "react";
import { Camera } from "lucide-react";
import { TREE_SURVEY_RECORDS } from "../../data/treeSurveyData";

type Props = {
  onSave?: () => void;
};

const FORMS = ["Measure", "Health", "Encroachment", "Watering", "Species"] as const;

export default function TreeAiCapturePanel({ onSave }: Props) {
  const tree = TREE_SURVEY_RECORDS[0];
  const [form, setForm] = useState<(typeof FORMS)[number]>("Measure");
  const [height, setHeight] = useState(tree.heightM);
  const [crown, setCrown] = useState(tree.crownSpreadM);

  return (
    <div className="space-y-3">
      <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100">
        <Camera className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-[10px] text-slate-500">
        Photo must include the mounted QR tag card ({tree.qrTagId}) as scale. Only height and crown are computed.
      </p>
      <div className="flex flex-wrap gap-1">
        {FORMS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setForm(item)}
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              form === item ? "bg-[#1A1A1A] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {form === "Measure" ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label>
            Height (m)
            <input
              className="mt-1 w-full rounded-md border px-2 py-1"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </label>
          <label>
            Crown (m)
            <input
              className="mt-1 w-full rounded-md border px-2 py-1"
              value={crown}
              onChange={(e) => setCrown(Number(e.target.value))}
            />
          </label>
        </div>
      ) : null}

      {form === "Health" ? (
        <p className="text-xs text-slate-600">Band: healthy / stressed / diseased. Pest checklist, lean, decay, mandatory photo. Officer-entered.</p>
      ) : null}
      {form === "Encroachment" ? (
        <p className="text-xs text-slate-600">Category, description, photo, GNSS. Status tracked to Range Officer QC.</p>
      ) : null}
      {form === "Watering" ? (
        <p className="text-xs text-slate-600">Date, method/quantity. Next due date computed from the plantation cycle.</p>
      ) : null}
      {form === "Species" ? (
        <p className="text-xs text-slate-600">Confirm or correct species at first survey. Not auto-classified from the photo.</p>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        className="w-full rounded-full bg-emerald-700 py-2 text-xs font-medium text-white"
      >
        Save form · queue for sync
      </button>
    </div>
  );
}
