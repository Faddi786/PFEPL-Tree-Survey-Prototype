import { motion } from "framer-motion";
import { Siren, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import { defaults as defaultControls } from "ol/control";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import { boundingExtent } from "ol/extent";
import { fromLonLat } from "ol/proj";
import { Stroke, Style } from "ol/style";
import { createBasemapSource, getBasemapMaxZoom } from "../../lib/basemaps";

export type EmergencyStation = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  /** Screen-side placement hint for label offset (avoids overlap). */
  labelSide?: "top" | "bottom" | "left" | "right";
};

/**
 * Demo stations placed as intentional lon/lat offsets within one local Karaikal coastal
 * viewport so a phone-sized fit spreads them: top / bottom / left / right / mid — not
 * clustered, and without a far Thanjavur outlier that forces zoom-out.
 */
export const EMERGENCY_STATIONS: EmergencyStation[] = [
  { id: "nedungadu", name: "Nedungadu", lon: 79.832, lat: 10.968, labelSide: "top" },
  { id: "kottucherry", name: "Kottucherry", lon: 79.831, lat: 10.878, labelSide: "bottom" },
  { id: "thirunallar", name: "Thirunallar", lon: 79.768, lat: 10.924, labelSide: "left" },
  { id: "karaikal", name: "Karaikal", lon: 79.898, lat: 10.922, labelSide: "right" },
  { id: "coastal", name: "Coastal HQ", lon: 79.858, lat: 10.948, labelSide: "right" },
];

/** Surveyor / person origin at the visual center of the station spread. */
export const EMERGENCY_ORIGIN = { lon: 79.832, lat: 10.923 };

type Props = {
  stations?: EmergencyStation[];
  className?: string;
};

function SirenMarker({ station, delay }: { station: EmergencyStation; delay: number }) {
  const side = station.labelSide ?? "bottom";
  const labelPos =
    side === "top"
      ? "mb-0.5 order-first"
      : side === "left"
        ? "mr-1 absolute right-full top-1/2 -translate-y-1/2"
        : side === "right"
          ? "ml-1 absolute left-full top-1/2 -translate-y-1/2"
          : "mt-0.5";

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex h-8 w-8 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-rose-500/40"
          animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.4, repeat: Infinity, delay }}
        />
        <motion.span
          className="absolute inset-0 rounded-full bg-rose-500/25"
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: delay + 0.3 }}
        />
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 shadow-md ring-2 ring-white">
          <Siren className="h-3 w-3 text-white" />
        </span>
      </div>
      <span
        className={`${labelPos} max-w-[70px] truncate rounded bg-black/55 px-1 py-px text-center text-[8px] font-medium text-white backdrop-blur-sm`}
      >
        {station.name}
      </span>
    </div>
  );
}

function SurveyorMarker() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative flex h-10 w-10 items-center justify-center"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute inset-0 rounded-full bg-sky-400/35 blur-[2px]" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 shadow-lg ring-2 ring-white">
          <UserRound className="h-4 w-4 text-white" />
        </span>
      </motion.div>
      <span className="mt-0.5 rounded bg-sky-950/70 px-1.5 py-px text-[8px] font-semibold text-sky-50 backdrop-blur-sm">
        You
      </span>
    </div>
  );
}

function alertLineStyle(feature: Feature<LineString>) {
  const grow = Number(feature.get("grow") ?? 1);
  const pulse = Number(feature.get("pulse") ?? 0);
  return [
    new Style({
      stroke: new Stroke({
        color: "rgba(255, 255, 255, 0.35)",
        width: 5,
        lineCap: "round",
      }),
    }),
    new Style({
      stroke: new Stroke({
        color: `rgba(244, 63, 94, ${0.35 + grow * 0.55})`,
        width: 2.5,
        lineCap: "round",
        lineDash: [10, 8],
        lineDashOffset: -pulse,
      }),
    }),
  ];
}

function interpolateCoord(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export default function MobileEmergencyMap({ stations = EMERGENCY_STATIONS, className = "h-full" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const basemap = new TileLayer({
      source: createBasemapSource("basemap-imagery"),
    });

    const originMerc = fromLonLat([EMERGENCY_ORIGIN.lon, EMERGENCY_ORIGIN.lat]);
    const stationMercs = stations.map((station) => fromLonLat([station.lon, station.lat]));

    const lineFeatures = stationMercs.map((_, i) => {
      const feature = new Feature({
        geometry: new LineString([originMerc, originMerc]),
        grow: 0,
        pulse: 0,
        stationIndex: i,
      });
      return feature;
    });

    const alertSource = new VectorSource({ features: lineFeatures });
    const alertLayer = new VectorLayer({
      source: alertSource,
      zIndex: 5,
      style: (feature) => alertLineStyle(feature as Feature<LineString>),
    });

    const roots: Root[] = [];

    const surveyorEl = document.createElement("div");
    surveyorEl.className = "pointer-events-none";
    const surveyorRoot = createRoot(surveyorEl);
    surveyorRoot.render(<SurveyorMarker />);
    roots.push(surveyorRoot);
    const surveyorOverlay = new Overlay({
      element: surveyorEl,
      positioning: "center-center",
      stopEvent: false,
    });
    surveyorOverlay.setPosition(originMerc);

    const overlays = stations.map((station, i) => {
      const el = document.createElement("div");
      el.className = "pointer-events-none";
      const root = createRoot(el);
      root.render(<SirenMarker station={station} delay={i * 0.15} />);
      roots.push(root);

      const overlay = new Overlay({
        element: el,
        positioning: "center-center",
        stopEvent: false,
      });
      overlay.setPosition(fromLonLat([station.lon, station.lat]));
      return overlay;
    });

    const maxZoom = getBasemapMaxZoom("basemap-imagery");
    const map = new Map({
      target,
      controls: defaultControls({ zoom: false, attribution: false }),
      layers: [basemap, alertLayer],
      overlays: [surveyorOverlay, ...overlays],
      view: new View({
        center: originMerc,
        zoom: 13,
        minZoom: 11,
        maxZoom,
      }),
    });

    const fitCoords = [originMerc, ...stationMercs];
    const extent = boundingExtent(fitCoords);
    if (extent.every((v) => Number.isFinite(v))) {
      map.getView().fit(extent, {
        padding: [88, 56, 140, 56],
        duration: 450,
        maxZoom: 14,
      });
    }

    mapRef.current = map;

    let raf = 0;
    const startedAt = performance.now();
    const LOOP_MS = 2800;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const loopT = (elapsed % LOOP_MS) / LOOP_MS;

      lineFeatures.forEach((feature, i) => {
        // Stagger each ray slightly so they don't fire in lockstep
        const stagger = (i * 0.07) % 0.35;
        const localT = (loopT + stagger) % 1;
        // Grow out, hold briefly, slight retract/pulse cycle for demo
        const localGrow =
          localT < 0.45
            ? localT / 0.45
            : localT < 0.75
              ? 1
              : Math.max(0.15, 1 - (localT - 0.75) / 0.25);
        const end = stationMercs[i];
        const tip = interpolateCoord(originMerc, end, localGrow);
        feature.set("grow", localGrow);
        feature.set("pulse", (elapsed / 30 + i * 12) % 200);
        (feature.getGeometry() as LineString).setCoordinates([originMerc, tip]);
      });
      alertSource.changed();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      map.setTarget(undefined);
      mapRef.current = null;
      roots.forEach((root) => {
        queueMicrotask(() => root.unmount());
      });
    };
  }, [stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    requestAnimationFrame(() => map.updateSize());
  });

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div ref={containerRef} className="h-full w-full touch-none bg-slate-800" />
    </div>
  );
}
