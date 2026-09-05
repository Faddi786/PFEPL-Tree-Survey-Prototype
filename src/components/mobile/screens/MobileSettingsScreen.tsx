import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Radio, Settings } from "lucide-react";
import { useMobileApp } from "../MobileAppContext";
import { SettingsScreenShell, settingsTransition } from "../mobileSettingsUi";

const hubItems = [
  {
    id: "rover-settings" as const,
    label: "Rover Settings",
    desc: "Rover, base station, DGPS & NTRIP",
    icon: Radio,
  },
  {
    id: "app-settings" as const,
    label: "App Settings",
    desc: "Notifications, sync, theme & database",
    icon: Settings,
  },
];

export default function MobileSettingsScreen() {
  const { closeOverlay, openOverlay } = useMobileApp();

  return (
    <SettingsScreenShell title="Settings" subtitle="Device & app configuration" onBack={closeOverlay}>
      <div className="space-y-3 p-4">
        <AnimatePresence>
          {hubItems.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...settingsTransition, delay: index * 0.06 }}
              onClick={() => openOverlay(item.id)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition active:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <item.icon className="h-4 w-4 text-slate-600" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-[#1A1A1A]">{item.label}</span>
                  <span className="text-[10px] text-slate-500">{item.desc}</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </SettingsScreenShell>
  );
}
