import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Database, Loader2, Lock, XCircle } from "lucide-react";
import { useState } from "react";
import { useMobileApp } from "../MobileAppContext";
import {
  SelectRow,
  SettingsScreenShell,
  SettingsSection,
  TextFieldRow,
  ToggleRow,
  settingsTransition,
} from "../mobileSettingsUi";

type TestStatus = "idle" | "testing" | "success" | "failure";

export default function MobileAppSettingsScreen() {
  const { openOverlay, pushIslandNotification } = useMobileApp();
  const [dbPanelOpen, setDbPanelOpen] = useState(false);
  const [dbUnlocked, setDbUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.nilam.tn.gov.in/v2/field");
  const [token, setToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState("Production");
  const [syncInterval, setSyncInterval] = useState("Every 15 min");
  const [theme, setTheme] = useState("System");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [saveFlash, setSaveFlash] = useState(false);

  function handleUnlock() {
    if (adminKey.trim().length > 0) {
      setDbUnlocked(true);
      setKeyError("");
      return;
    }
    setKeyError("Enter an admin key");
  }

  function handleSave() {
    setSaveFlash(true);
    pushIslandNotification({
      title: "Database config saved",
      subtitle: `${environment} · demo only`,
      icon: "check",
      durationMs: 2800,
    });
    window.setTimeout(() => setSaveFlash(false), 1200);
  }

  function handleTestConnection() {
    setTestStatus("testing");
    window.setTimeout(() => {
      const ok = apiUrl.toLowerCase().includes("http") && token.trim().length > 0;
      setTestStatus(ok ? "success" : "failure");
      pushIslandNotification({
        title: ok ? "Connection successful" : "Connection failed",
        subtitle: ok ? "API reachable · demo" : "Check URL and token",
        icon: ok ? "check" : "radio",
        durationMs: 3200,
      });
      window.setTimeout(() => setTestStatus("idle"), 4000);
    }, 1500);
  }

  return (
    <SettingsScreenShell
      title="App Settings"
      subtitle="Tree Survey mobile preferences"
      onBack={() => openOverlay("settings")}
      zIndex="z-40"
    >
      <div className="space-y-4 p-4">
        <SettingsSection title="Administration">
          <button
            type="button"
            onClick={() => setDbPanelOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-left transition active:bg-amber-50"
          >
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-700" />
              <span>
                <span className="block text-sm font-medium text-[#1A1A1A]">Update Database Configuration</span>
                <span className="text-[10px] text-slate-500">API endpoint, token & environment</span>
              </span>
            </span>
            <ChevronRight
              className={`h-4 w-4 text-slate-400 transition ${dbPanelOpen ? "rotate-90" : ""}`}
            />
          </button>

          <AnimatePresence>
            {dbPanelOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={settingsTransition}
                className="overflow-hidden"
              >
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                  {!dbUnlocked ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                        Enter admin key to unlock configuration
                      </div>
                      <input
                        type="password"
                        value={adminKey}
                        onChange={(e) => {
                          setAdminKey(e.target.value);
                          setKeyError("");
                        }}
                        placeholder="Admin key"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      />
                      {keyError ? <p className="text-[10px] text-rose-500">{keyError}</p> : null}
                      <button
                        type="button"
                        onClick={handleUnlock}
                        className="w-full rounded-lg bg-[#1A1A1A] py-2 text-sm font-medium text-white transition active:scale-[0.98]"
                      >
                        Unlock
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <TextFieldRow
                        label="Database API URL"
                        value={apiUrl}
                        onChange={setApiUrl}
                        placeholder="https://api.example.gov.in/v2"
                      />
                      <TextFieldRow
                        label="Bearer token"
                        value={token}
                        onChange={setToken}
                        type="password"
                        placeholder="Paste access token"
                      />
                      <TextFieldRow
                        label="API key"
                        value={apiKey}
                        onChange={setApiKey}
                        type="password"
                        placeholder="Optional service key"
                      />
                      <SelectRow
                        label="Environment"
                        value={environment}
                        onChange={setEnvironment}
                        options={["Production", "Staging", "Development"]}
                      />

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSave}
                          className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition ${
                            saveFlash ? "bg-emerald-500" : "bg-[#1A1A1A]"
                          }`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={testStatus === "testing"}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-[#1A1A1A] transition disabled:opacity-60"
                        >
                          {testStatus === "testing" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Test Connection
                        </button>
                      </div>

                      <AnimatePresence>
                        {testStatus === "success" ? (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Connected — API responded (demo)
                          </motion.p>
                        ) : null}
                        {testStatus === "failure" ? (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-rose-500"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Failed — URL must contain http and token required
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <ToggleRow label="Push alerts" desc="Sync & assignment updates" defaultOn />
          <ToggleRow label="SMS fallback" desc="When offline for 24h" />
          <ToggleRow label="Emergency broadcast" desc="District-wide alerts" defaultOn />
        </SettingsSection>

        <SettingsSection title="Data & sync">
          <SelectRow
            label="Sync interval"
            value={syncInterval}
            onChange={setSyncInterval}
            options={["Every 5 min", "Every 15 min", "Every 30 min", "Manual only"]}
          />
          <ToggleRow label="Auto-sync on Wi‑Fi" desc="Upload when connected" defaultOn />
          <ToggleRow label="Background sync" desc="Continue while app minimized" defaultOn />
          <ToggleRow label="Compress uploads" desc="Reduce packet size on cellular" defaultOn />
        </SettingsSection>

        <SettingsSection title="Display & locale">
          <SelectRow label="Theme" value={theme} onChange={setTheme} options={["System", "Light", "Dark"]} />
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <p className="text-sm font-medium text-[#1A1A1A]">Language</p>
            <p className="text-[10px] text-slate-500">English · தமிழ் · हिन्दी</p>
          </div>
          <ToggleRow label="High contrast map" desc="Outdoor visibility" />
          <ToggleRow label="Haptic feedback" desc="Button taps & capture confirm" defaultOn />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <ToggleRow label="Location always on" desc="Required for field capture" defaultOn />
          <ToggleRow label="Analytics" desc="Anonymous usage metrics" />
        </SettingsSection>

        <SettingsSection title="About">
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <p className="text-sm font-medium text-[#1A1A1A]">Tree Survey Mobile v2.4.1</p>
            <p className="text-[10px] text-slate-500">Build 2026.07.08 · Demo</p>
          </div>
        </SettingsSection>
      </div>
    </SettingsScreenShell>
  );
}
