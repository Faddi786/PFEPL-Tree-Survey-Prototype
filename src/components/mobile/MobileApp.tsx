import { Home, Map, Camera, Radio, Upload } from "lucide-react";
import { useState } from "react";
import { SKIP_MOBILE_INTRO, type MobileTab } from "../../data/mobileApp";
import DynamicIslandNotifier from "./DynamicIslandNotifier";
import PhoneFrame from "./PhoneFrame";
import { MobileAppProvider, useMobileApp } from "./MobileAppContext";
import MobileAppSettingsScreen from "./screens/MobileAppSettingsScreen";
import MobileAssistScreen from "./screens/MobileAssistScreen";
import MobileCaptureScreen from "./screens/MobileCaptureScreen";
import MobileDgpsScreen from "./screens/MobileDgpsScreen";
import MobileDprDateDetailScreen from "./screens/MobileDprDateDetailScreen";
import MobileDprParcelPointsScreen from "./screens/MobileDprParcelPointsScreen";
import MobileHomeScreen from "./screens/MobileHomeScreen";
import MobileLockScreen from "./screens/MobileLockScreen";
import MobileLoginScreen from "./screens/MobileLoginScreen";
import MobileMapScreen from "./screens/MobileMapScreen";
import MobileProfileScreen from "./screens/MobileProfileScreen";
import MobileRoverSettingsScreen from "./screens/MobileRoverSettingsScreen";
import MobileSettingsScreen from "./screens/MobileSettingsScreen";
import MobileSyncScreen from "./screens/MobileSyncScreen";

const tabs: Array<{ id: MobileTab; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "map", label: "Map", icon: Map },
  { id: "capture", label: "Capture", icon: Camera },
  { id: "dgps", label: "DGPS", icon: Radio },
  { id: "sync", label: "Sync", icon: Upload },
];

function MobileBottomNav() {
  const { tab, setTab } = useMobileApp();

  return (
    <nav className="flex shrink-0 border-t border-slate-200/80 bg-white px-0.5 pb-[2px] pt-1">
      {tabs.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition ${
              active ? "text-[#1A1A1A]" : "text-slate-400"
            }`}
          >
            <item.icon className={`h-3.5 w-3.5 ${active ? "stroke-[2.5px]" : ""}`} />
            <span className="text-[8px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileOverlays() {
  const { overlay } = useMobileApp();
  if (!overlay) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50">
      {overlay === "profile" ? <MobileProfileScreen /> : null}
      {overlay === "settings" ? <MobileSettingsScreen /> : null}
      {overlay === "app-settings" ? <MobileAppSettingsScreen /> : null}
      {overlay === "rover-settings" ? <MobileRoverSettingsScreen /> : null}
      {overlay === "dpr-date" ? <MobileDprDateDetailScreen /> : null}
      {overlay === "dpr-parcel" ? <MobileDprParcelPointsScreen /> : null}
    </div>
  );
}

function MobileAppShell({
  phoneUnlocked,
  onPhoneUnlock,
}: {
  phoneUnlocked: boolean;
  onPhoneUnlock: () => void;
}) {
  const { officer, tab } = useMobileApp();

  if (!phoneUnlocked) {
    return <MobileLockScreen onUnlock={onPhoneUnlock} />;
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <DynamicIslandNotifier />

      {!officer ? (
        <div className="h-full overflow-hidden pt-[calc(4px+2%+34px)]">
          <MobileLoginScreen />
        </div>
      ) : (
        <>
          <div className="relative min-h-0 flex-1 overflow-hidden pt-[calc(4px+2%+34px)]">
            <div className="relative z-0 h-full">
              {tab === "home" ? <MobileHomeScreen /> : null}
              {tab === "map" ? <MobileMapScreen /> : null}
              {tab === "capture" ? <MobileCaptureScreen /> : null}
              {tab === "dgps" ? <MobileDgpsScreen /> : null}
              {tab === "assist" ? <MobileAssistScreen /> : null}
              {tab === "sync" ? <MobileSyncScreen /> : null}
            </div>
            <MobileOverlays />
          </div>
          <MobileBottomNav />
        </>
      )}
    </div>
  );
}

type Props = {
  theatre?: boolean;
};

export default function MobileApp({ theatre = false }: Props) {
  const [phoneUnlocked, setPhoneUnlocked] = useState(() => SKIP_MOBILE_INTRO);

  return (
    <div className="flex h-full w-full justify-center">
      <PhoneFrame mode={phoneUnlocked ? "app" : "lock"} theatre={theatre}>
        <MobileAppProvider>
          <MobileAppShell phoneUnlocked={phoneUnlocked} onPhoneUnlock={() => setPhoneUnlocked(true)} />
        </MobileAppProvider>
      </PhoneFrame>
    </div>
  );
}
