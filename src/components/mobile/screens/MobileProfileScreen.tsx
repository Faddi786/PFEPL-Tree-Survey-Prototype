import { ArrowLeft, ChevronRight, Mail, Phone, Settings, User } from "lucide-react";
import { useState } from "react";
import { DEMO_SURVEYOR_PROFILE, SURVEYOR_PHOTO_URL } from "../../../data/mobileApp";
import { useMobileApp } from "../MobileAppContext";

export default function MobileProfileScreen() {
  const { closeOverlay, openOverlay } = useMobileApp();
  const profile = DEMO_SURVEYOR_PROFILE;
  const [photoError, setPhotoError] = useState(false);

  const fields = [
    { label: "Employee ID", value: profile.employeeId },
    { label: "Department", value: profile.department },
    { label: "Phone", value: profile.phone, icon: Phone },
    { label: "Email", value: profile.email, icon: Mail },
    { label: "Assigned district", value: profile.assignedDistrict },
    { label: "Assigned village", value: profile.assignedVillage },
    { label: "Taluk", value: profile.assignedTaluk },
    { label: "Region", value: profile.region },
    { label: "Badge", value: profile.badge },
    { label: "Joining date", value: profile.joiningDate },
    { label: "Supervisor", value: profile.supervisor },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#F7F7F5]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <button type="button" onClick={closeOverlay} className="rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">My Profile</p>
          <p className="text-[10px] text-slate-500">Field officer details</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4">
          {photoError ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100">
              <User className="h-10 w-10 text-slate-400" />
            </div>
          ) : (
            <img
              src={SURVEYOR_PHOTO_URL}
              alt={profile.name}
              className="h-24 w-24 rounded-full border-2 border-slate-200 object-cover"
              onError={() => setPhotoError(true)}
            />
          )}
          <p className="mt-3 text-lg font-semibold text-[#1A1A1A]">{profile.name}</p>
          <p className="text-xs text-slate-500">{profile.role}</p>
          <div className="mt-2 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
            <User className="h-3 w-3" />
            {profile.id}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          {fields.map((field) => (
            <div key={field.label} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{field.label}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#1A1A1A]">
                {field.icon ? <field.icon className="h-3.5 w-3.5 text-slate-400" /> : null}
                {field.value}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openOverlay("settings")}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition active:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            <span>
              <span className="block text-sm font-medium text-[#1A1A1A]">Settings</span>
              <span className="text-[10px] text-slate-500">Rover & app configuration</span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
