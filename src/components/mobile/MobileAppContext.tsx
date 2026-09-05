import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEMO_FIELD_OFFICER,
  FIELD_PACKETS,
  INITIAL_GNSS_POINTS,
  SKIP_MOBILE_INTRO,
  type CapturedGnssPoint,
  type FieldOfficer,
  type FieldPacket,
  type MobileOverlayScreen,
  type MobileTab,
} from "../../data/mobileApp";
import { SURVEY_ORIGIN } from "../../data/treeSurveyData";

export type IslandNotification = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: "message" | "wifi" | "loader" | "upload" | "bluetooth" | "check" | "radio";
  durationMs?: number;
};

type MobileAppState = {
  officer: FieldOfficer | null;
  tab: MobileTab;
  overlay: MobileOverlayScreen | null;
  dprSelectedDate: string | null;
  dprSelectedParcelId: string | null;
  selectedParcelId: string | null;
  pendingNavigateTreeId: string | null;
  returnTab: MobileTab | null;
  gnssConnected: boolean;
  gnssPoints: CapturedGnssPoint[];
  packets: FieldPacket[];
  nextPointId: string;
  islandNotification: IslandNotification | null;
  login: (userId: string) => void;
  logout: () => void;
  setTab: (tab: MobileTab) => void;
  navigateFromChat: (tab: MobileTab) => void;
  returnToChat: () => void;
  openOverlay: (screen: MobileOverlayScreen) => void;
  closeOverlay: () => void;
  openDprDate: (date: string) => void;
  openDprParcel: (parcelId: string) => void;
  closeDpr: () => void;
  backFromDprParcel: () => void;
  openParcel: (id: string) => void;
  closeParcel: () => void;
  requestNavigateToTree: (treeId: string) => void;
  consumePendingNavigateTreeId: () => string | null;
  connectGnss: () => void;
  disconnectGnss: () => void;
  captureGnssPoint: () => void;
  setNextPointId: (id: string) => void;
  setPacketProgress: (id: string, progressPct: number, status?: FieldPacket["status"]) => void;
  markGnssSynced: () => void;
  downloadPacket: (id: string) => void;
  pushIslandNotification: (notification: Omit<IslandNotification, "id">) => void;
  clearIslandNotification: () => void;
};

const MobileAppContext = createContext<MobileAppState | null>(null);

export function MobileAppProvider({ children }: { children: ReactNode }) {
  const [officer, setOfficer] = useState<FieldOfficer | null>(() =>
    SKIP_MOBILE_INTRO ? DEMO_FIELD_OFFICER : null,
  );
  const [tab, setTab] = useState<MobileTab>("home");
  const [overlay, setOverlay] = useState<MobileOverlayScreen | null>(null);
  const [dprSelectedDate, setDprSelectedDate] = useState<string | null>(null);
  const [dprSelectedParcelId, setDprSelectedParcelId] = useState<string | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [pendingNavigateTreeId, setPendingNavigateTreeId] = useState<string | null>(null);
  const [returnTab, setReturnTab] = useState<MobileTab | null>(null);
  const [gnssConnected, setGnssConnected] = useState(false);
  const [gnssPoints, setGnssPoints] = useState<CapturedGnssPoint[]>(INITIAL_GNSS_POINTS);
  const [packets, setPackets] = useState<FieldPacket[]>(FIELD_PACKETS);
  const [nextPointId, setNextPointId] = useState(
    () => `TREE-A-${String(INITIAL_GNSS_POINTS.length + 1).padStart(2, "0")}`,
  );
  const [islandNotification, setIslandNotification] = useState<IslandNotification | null>(null);
  const dismissTimer = useRef<number | null>(null);

  const clearIslandNotification = useCallback(() => {
    if (dismissTimer.current) {
      window.clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    setIslandNotification(null);
  }, []);

  const pushIslandNotification = useCallback(
    (notification: Omit<IslandNotification, "id">) => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
      const next: IslandNotification = { ...notification, id: `island-${Date.now()}` };
      setIslandNotification(next);
      const duration = notification.durationMs ?? 4500;
      dismissTimer.current = window.setTimeout(() => {
        setIslandNotification((current) => (current?.id === next.id ? null : current));
        dismissTimer.current = null;
      }, duration);
    },
    [],
  );

  const setPacketProgress = useCallback((id: string, progressPct: number, status?: FieldPacket["status"]) => {
    setPackets((prev) =>
      prev.map((pkt) =>
        pkt.id === id
          ? {
              ...pkt,
              progressPct,
              ...(status ? { status } : {}),
            }
          : pkt,
      ),
    );
  }, []);

  const markGnssSynced = useCallback(() => {
    setGnssPoints((prev) => prev.map((p) => ({ ...p, synced: true })));
  }, []);

  const applyTab = useCallback((next: MobileTab, opts?: { keepReturn?: boolean }) => {
    setTab(next);
    setOverlay(null);
    setDprSelectedDate(null);
    setDprSelectedParcelId(null);
    if (!opts?.keepReturn) {
      setReturnTab(null);
    }
  }, []);

  const value = useMemo<MobileAppState>(
    () => ({
      officer,
      tab,
      overlay,
      dprSelectedDate,
      dprSelectedParcelId,
      selectedParcelId,
      pendingNavigateTreeId,
      returnTab,
      gnssConnected,
      gnssPoints,
      packets,
      nextPointId,
      islandNotification,
      login: (userId: string) => {
        setOfficer({
          ...DEMO_FIELD_OFFICER,
          id: userId || DEMO_FIELD_OFFICER.id,
        });
        setTab("home");
      },
      logout: () => {
        setOfficer(null);
        setSelectedParcelId(null);
        setPendingNavigateTreeId(null);
        setOverlay(null);
        setDprSelectedDate(null);
        setDprSelectedParcelId(null);
        setReturnTab(null);
        setTab("home");
        clearIslandNotification();
      },
      setTab: (next) => applyTab(next),
      navigateFromChat: (next) => {
        setReturnTab("assist");
        applyTab(next, { keepReturn: true });
      },
      returnToChat: () => {
        if (!returnTab) return;
        const target = returnTab;
        setReturnTab(null);
        applyTab(target);
      },
      openOverlay: (screen) => setOverlay(screen),
      closeOverlay: () => setOverlay(null),
      openDprDate: (date) => {
        setDprSelectedDate(date);
        setDprSelectedParcelId(null);
        setOverlay("dpr-date");
      },
      openDprParcel: (parcelId) => {
        setDprSelectedParcelId(parcelId);
        setOverlay("dpr-parcel");
      },
      closeDpr: () => {
        setDprSelectedDate(null);
        setDprSelectedParcelId(null);
        setOverlay(null);
      },
      backFromDprParcel: () => {
        setDprSelectedParcelId(null);
        setOverlay("dpr-date");
      },
      openParcel: (id: string) => setSelectedParcelId(id),
      closeParcel: () => setSelectedParcelId(null),
      requestNavigateToTree: (treeId) => setPendingNavigateTreeId(treeId),
      consumePendingNavigateTreeId: () => {
        const taken = pendingNavigateTreeId;
        if (taken) setPendingNavigateTreeId(null);
        return taken;
      },
      connectGnss: () => {
        pushIslandNotification({
          title: "Searching for rover…",
          subtitle: "Bluetooth pairing",
          icon: "loader",
          durationMs: 1800,
        });
        window.setTimeout(() => {
          setGnssConnected(true);
          pushIslandNotification({
            title: "Trimble R12 connected",
            subtitle: "RTK fix · ±0.09 m",
            icon: "check",
            durationMs: 3500,
          });
        }, 1800);
      },
      disconnectGnss: () => {
        setGnssConnected(false);
        pushIslandNotification({
          title: "Rover disconnected",
          icon: "radio",
          durationMs: 2500,
        });
      },
      captureGnssPoint: () => {
        if (!gnssConnected) return;
        const label = nextPointId.trim() || `GCP-KHT-${String(gnssPoints.length + 1).padStart(2, "0")}`;
        const next: CapturedGnssPoint = {
          id: `gnss-${Date.now()}`,
          label,
          lat: SURVEY_ORIGIN.lat + (Math.random() - 0.5) * 0.002,
          lng: SURVEY_ORIGIN.lng + (Math.random() - 0.5) * 0.002,
          accuracyM: Number((0.06 + Math.random() * 0.12).toFixed(2)),
          source: "bluetooth",
          capturedAt: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          synced: false,
        };
        setGnssPoints((prev) => [next, ...prev]);
        const match = label.match(/(\d+)\s*$/);
        const nextNum = match ? Number(match[1]) + 1 : gnssPoints.length + 2;
        setNextPointId(`GCP-KHT-${String(nextNum).padStart(2, "0")}`);
        pushIslandNotification({
          title: "Control point captured",
          subtitle: next.label,
          icon: "check",
          durationMs: 2800,
        });
      },
      setNextPointId,
      setPacketProgress,
      markGnssSynced,
      downloadPacket: (id: string) => {
        setPackets((prev) =>
          prev.map((pkt) => (pkt.id === id && pkt.status === "assigned" ? { ...pkt, status: "downloaded" } : pkt)),
        );
      },
      pushIslandNotification,
      clearIslandNotification,
    }),
    [
      officer,
      tab,
      overlay,
      dprSelectedDate,
      dprSelectedParcelId,
      selectedParcelId,
      pendingNavigateTreeId,
      returnTab,
      gnssConnected,
      gnssPoints,
      packets,
      nextPointId,
      islandNotification,
      setPacketProgress,
      markGnssSynced,
      pushIslandNotification,
      clearIslandNotification,
      applyTab,
    ],
  );

  useEffect(
    () => () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    },
    [],
  );

  return <MobileAppContext.Provider value={value}>{children}</MobileAppContext.Provider>;
}

export function useMobileApp() {
  const ctx = useContext(MobileAppContext);
  if (!ctx) throw new Error("useMobileApp must be used within MobileAppProvider");
  return ctx;
}
