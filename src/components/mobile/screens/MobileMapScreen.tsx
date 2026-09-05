import { useEffect, useRef, useState } from "react";
import { Crosshair, Layers, Palette, TreeDeciduous, X } from "lucide-react";
import type { MobileBasemapId, MobileMapViewHandle } from "../MobileMapView";
import MobileMapView from "../MobileMapView";
import MobileChatBackButton from "../MobileChatBackButton";
import { useMobileApp } from "../MobileAppContext";
import TreeAttributePanel from "../../tree/TreeAttributePanel";
import type { TreeRecord } from "../../../data/treeSurveyData";
import { SURVEY_ORIGIN, getTreeById } from "../../../data/treeSurveyData";
import {
  defaultSurveyPin,
  fetchWalkingRoute,
  isWithinSurveyArea,
  type LatLng,
  type WalkingRoute,
} from "../../../lib/mobileNavigation";
import { AnimatePresence } from "framer-motion";

const basemapOptions: Array<{ id: MobileBasemapId; label: string }> = [
  { id: "basemap-carto", label: "Carto Positron" },
  { id: "basemap-osm", label: "OpenStreetMap" },
  { id: "basemap-imagery", label: "World Imagery" },
];

function resolveSurveyPin(candidate: LatLng | null | undefined): LatLng {
  if (candidate && isWithinSurveyArea(candidate, SURVEY_ORIGIN)) return candidate;
  return defaultSurveyPin(SURVEY_ORIGIN);
}

export default function MobileMapScreen() {
  const { openParcel, gnssPoints, pendingNavigateTreeId, consumePendingNavigateTreeId } = useMobileApp();
  const mapApiRef = useRef<MobileMapViewHandle | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [dgpsOpen, setDgpsOpen] = useState(false);
  const [basemapId, setBasemapId] = useState<MobileBasemapId>("basemap-osm");
  const [showParcels, setShowParcels] = useState(false);
  const [showTrees, setShowTrees] = useState(true);
  const [showHealth, setShowHealth] = useState(false);
  const [showVariance] = useState(false);
  const [dgpsShowPending, setDgpsShowPending] = useState(true);
  const [dgpsShowUploaded, setDgpsShowUploaded] = useState(true);
  const [selectedTree, setSelectedTree] = useState<TreeRecord | null>(null);
  const routeRequestId = useRef(0);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<TreeRecord | null>(null);
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const showDgps = dgpsShowPending || dgpsShowUploaded;
  const showingPath = Boolean(destination);

  useEffect(() => {
    if (!layersOpen && !dgpsOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLayersOpen(false);
        setDgpsOpen(false);
        setSelectedTree(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layersOpen, dgpsOpen]);

  function clearPath() {
    routeRequestId.current += 1;
    setRoute(null);
    setDestination(null);
    setUserLocation(null);
  }

  async function openNavigateTo(tree: TreeRecord) {
    setSelectedTree(null);
    setDestination(tree);
    setRoute(null);

    const from = resolveSurveyPin(mapApiRef.current?.getViewCenter());
    setUserLocation(from);

    const requestId = ++routeRequestId.current;
    const dest = { lat: tree.lat, lng: tree.lng };
    const next = await fetchWalkingRoute(from, dest);
    if (requestId !== routeRequestId.current) return;

    // Belt-and-suspenders: path must start at blue and end at black.
    if (next.coords.length >= 2) {
      next.coords[0] = from;
      next.coords[next.coords.length - 1] = dest;
    } else {
      next.coords = [from, dest];
    }

    setRoute(next);
    mapApiRef.current?.fitToCoords([from, ...next.coords, dest]);
  }

  useEffect(() => {
    if (!pendingNavigateTreeId) return;
    const treeId = consumePendingNavigateTreeId();
    if (!treeId) return;
    const tree = getTreeById(treeId);
    if (tree) void openNavigateTo(tree);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when Assist hands off a tree
  }, [pendingNavigateTreeId]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <MobileChatBackButton onBack={clearPath} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A]">Tree map</p>
            <p className="text-[10px] text-slate-500">Green Belt Sector A</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHealth((v) => !v)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition ${
              showHealth
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            title="Health colour coding"
          >
            <Palette className="h-3 w-3" />
            Health
          </button>
          <button
            type="button"
            onClick={() => {
              setDgpsOpen((v) => !v);
              setLayersOpen(false);
            }}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition ${
              showDgps ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600"
            }`}
            title="Filter survey routes"
          >
            <Crosshair className="h-3 w-3" />
            Routes
          </button>
          <button
            type="button"
            onClick={() => {
              setLayersOpen((v) => !v);
              setDgpsOpen(false);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600"
          >
            <Layers className="h-3 w-3" />
            Layers
          </button>
        </div>
      </div>

      {dgpsOpen ? (
        <>
          <button
            type="button"
            aria-label="Close routes filter"
            className="absolute inset-0 z-10 bg-black/5"
            onClick={() => setDgpsOpen(false)}
          />
          <div className="absolute right-[4.5rem] top-14 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Route filter</p>
            <label className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={dgpsShowPending} onChange={() => setDgpsShowPending((v) => !v)} />
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Pending upload
              </span>
            </label>
            <label className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={dgpsShowUploaded} onChange={() => setDgpsShowUploaded((v) => !v)} />
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Uploaded
              </span>
            </label>
          </div>
        </>
      ) : null}

      {layersOpen ? (
        <>
          <button
            type="button"
            aria-label="Close layers"
            className="absolute inset-0 z-10 bg-black/5"
            onClick={() => setLayersOpen(false)}
          />
          <div className="absolute right-3 top-14 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Basemap</p>
            <div className="space-y-1">
              {basemapOptions.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="mobile-basemap"
                    checked={basemapId === opt.id}
                    onChange={() => setBasemapId(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="mb-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Overlays</p>
            <label className="flex items-center gap-2 text-[11px] text-slate-700">
              <input type="checkbox" checked={showTrees} onChange={() => setShowTrees((v) => !v)} />
              <TreeDeciduous className="h-3 w-3" /> Trees
            </label>
            <label className="flex items-center gap-2 text-[11px] text-slate-700">
              <input type="checkbox" checked={showParcels} onChange={() => setShowParcels((v) => !v)} />
              Survey zone boundaries
            </label>
          </div>
        </>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MobileMapView
          ref={mapApiRef}
          basemapId={basemapId}
          showParcels={showParcels}
          showTrees={showTrees && !showingPath}
          treeLayerMode={showHealth ? "health" : "default"}
          showVariance={showVariance}
          showDgps={showDgps && !showingPath}
          dgpsShowPending={dgpsShowPending}
          dgpsShowUploaded={dgpsShowUploaded}
          gnssPoints={gnssPoints}
          onParcelClick={openParcel}
          onTreeClick={(tree) => {
            clearPath();
            setSelectedTree(tree);
          }}
          userLocation={userLocation}
          destination={destination ? { lat: destination.lat, lng: destination.lng } : null}
          routeCoords={route?.coords ?? []}
          locationPickMode={false}
          showDemoRoutes={false}
        />

        {showingPath && destination ? (
          <button
            type="button"
            onClick={clearPath}
            className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-md"
            aria-label="Clear path"
          >
            {destination.label}
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        ) : null}

        <AnimatePresence>
          {selectedTree && !showingPath ? (
            <TreeAttributePanel
              tree={selectedTree}
              onClose={() => setSelectedTree(null)}
              onNavigate={() => void openNavigateTo(selectedTree)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
