import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export const settingsTransition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function ToggleRow({
  label,
  desc,
  defaultOn = false,
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export function TextFieldRow({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-slate-300"
      />
    </div>
  );
}

export function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm text-[#1A1A1A] outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SettingsScreenShell({
  title,
  subtitle,
  onBack,
  children,
  zIndex = "z-30",
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
  zIndex?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={settingsTransition}
      className={`absolute inset-0 ${zIndex} flex flex-col bg-[#F7F7F5]`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <button type="button" onClick={onBack} className="rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">{title}</p>
          <p className="text-[10px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </motion.div>
  );
}
