import { useState } from "react";
import { useMobileApp } from "../MobileAppContext";
import {
  SelectRow,
  SettingsScreenShell,
  SettingsSection,
  TextFieldRow,
  ToggleRow,
} from "../mobileSettingsUi";

export default function MobileRoverSettingsScreen() {
  const { openOverlay } = useMobileApp();

  const [roverModel, setRoverModel] = useState("Trimble R12");
  const [roverSerial, setRoverSerial] = useState("R12-88421");
  const [roverBluetooth, setRoverBluetooth] = useState("TRMBLE_R12_88421");
  const [baseModel, setBaseModel] = useState("Trimble NetR9");
  const [baseSerial, setBaseSerial] = useState("NR9-12045");
  const [baseIp, setBaseIp] = useState("192.168.1.50");
  const [mountPoint, setMountPoint] = useState("TN-GNSS-RTK");
  const [casterUrl, setCasterUrl] = useState("ntrip.tn.gov.in:2101");
  const [antennaHeight, setAntennaHeight] = useState("1.85");
  const [receiverType, setReceiverType] = useState("Multi-frequency GNSS");
  const [ntripUser, setNtripUser] = useState("tn_field_1042");

  return (
    <SettingsScreenShell
      title="Rover Settings"
      subtitle="DGPS / GNSS device configuration"
      onBack={() => openOverlay("settings")}
      zIndex="z-40"
    >
      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
          <p className="text-sm font-medium text-[#1A1A1A]">Device set · Demo</p>
          <p className="text-[10px] text-slate-500">Configure rover, base & corrections — no real hardware</p>
        </div>

        <SettingsSection title="Rover">
          <SelectRow
            label="Model"
            value={roverModel}
            onChange={setRoverModel}
            options={["Trimble R12", "Trimble R10", "Leica GS18", "South Galaxy G7"]}
          />
          <TextFieldRow label="Serial number" value={roverSerial} onChange={setRoverSerial} />
          <TextFieldRow
            label="Bluetooth name"
            value={roverBluetooth}
            onChange={setRoverBluetooth}
            placeholder="Device broadcast name"
          />
          <ToggleRow label="Auto-reconnect rover" desc="Restore pairing on app launch" defaultOn />
        </SettingsSection>

        <SettingsSection title="Base station">
          <SelectRow
            label="Model"
            value={baseModel}
            onChange={setBaseModel}
            options={["Trimble NetR9", "Leica GR30", "Septentrio Mosaic", "Custom CORS"]}
          />
          <TextFieldRow label="Serial number" value={baseSerial} onChange={setBaseSerial} />
          <TextFieldRow label="IP address" value={baseIp} onChange={setBaseIp} placeholder="192.168.x.x" />
          <TextFieldRow label="Mount point" value={mountPoint} onChange={setMountPoint} />
          <ToggleRow label="Use base over IP" desc="Prefer TCP/IP when in range" />
        </SettingsSection>

        <SettingsSection title="DGPS instruments">
          <SelectRow
            label="Receiver type"
            value={receiverType}
            onChange={setReceiverType}
            options={["Multi-frequency GNSS", "Dual-frequency RTK", "Single-frequency DGPS"]}
          />
          <TextFieldRow
            label="Antenna height (m)"
            value={antennaHeight}
            onChange={setAntennaHeight}
            placeholder="1.85"
          />
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <p className="text-sm font-medium text-[#1A1A1A]">Min accuracy threshold</p>
            <p className="text-[10px] text-slate-500">±0.15 m · RTK Fixed required</p>
          </div>
          <ToggleRow label="Store raw observations" desc="RINEX for post-processing" />
        </SettingsSection>

        <SettingsSection title="NTRIP / corrections">
          <TextFieldRow label="Caster URL" value={casterUrl} onChange={setCasterUrl} />
          <TextFieldRow label="Username" value={ntripUser} onChange={setNtripUser} />
          <ToggleRow label="Auto NTRIP on connect" desc="Start corrections with rover" defaultOn />
          <ToggleRow label="Bluetooth priority" desc="Prefer BT over USB for rover link" defaultOn />
        </SettingsSection>

        <SettingsSection title="Capture defaults">
          <ToggleRow label="Auto-increment point IDs" desc="GCP-KHT-## sequence" defaultOn />
          <ToggleRow label="Prompt before capture" desc="Confirm each control point" />
        </SettingsSection>
      </div>
    </SettingsScreenShell>
  );
}
