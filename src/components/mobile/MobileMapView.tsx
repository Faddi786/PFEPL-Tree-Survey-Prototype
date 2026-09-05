import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import { defaults as defaultControls } from "ol/control";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import { fromLonLat, toLonLat } from "ol/proj";
import { boundingExtent } from "ol/extent";
import { Fill, Stroke, Style, Circle as CircleStyle, RegularShape } from "ol/style";
import type { Geometry } from "ol/geom";
import {
  DEFAULT_REGION_KEY,
  PARCEL_BOUNDARY_STROKE,
  VARIANCE_BAND_COLORS_SOLID,
  type RegionDataset,
} from "../../data/mockData";
import {
  getWorkbenchRegionDatasetSync,
  loadWorkbenchRegionDataset,
} from "../../data/workbenchParcels";
import type { CapturedGnssPoint } from "../../data/mobileApp";
import { buildDemoSurveyorRoutes, type SurveyorDemoRoute } from "../../data/mobileSurveyorRoutes";
import { attachTreeSurveyLayer, type TreeLayerMode } from "../../hooks/useTreeSurveyLayer";
import type { TreeRecord } from "../../data/treeSurveyData";
import { SURVEY_ORIGIN } from "../../data/treeSurveyData";
import type { LatLng } from "../../lib/mobileNavigation";

import {
  createBasemapSource,
  getBasemapMaxZoom,
  offsetCenterForDefaultPan,
  type BasemapId,
} from "../../lib/basemaps";

export type MobileBasemapId = BasemapId;

export type MobileMapViewHandle = {
  getViewCenter: () => LatLng | null;
  panTo: (location: LatLng, zoom?: number) => void;
  fitToCoords: (coords: LatLng[]) => void;
};

type Props = {
  basemapId: MobileBasemapId;
  showParcels: boolean;
  showTrees?: boolean;
  treeLayerMode?: TreeLayerMode;
  showVariance: boolean;
  showDgps: boolean;
  dgpsShowPending: boolean;
  dgpsShowUploaded: boolean;
  gnssPoints: CapturedGnssPoint[];
  onParcelClick: (parcelId: string) => void;
  onTreeClick?: (tree: TreeRecord) => void;
  userLocation?: LatLng | null;
  destination?: LatLng | null;
  routeCoords?: LatLng[];
  locationPickMode?: boolean;
  onMapLocationPick?: (location: LatLng) => void;
  /** Hide cadastral demo surveyor paths while navigating to a tree. */
  showDemoRoutes?: boolean;
};

function gnssToFeatures(points: CapturedGnssPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point) => ({
      type: "Feature" as const,
      properties: { id: point.id, label: point.label, synced: point.synced },
      geometry: { type: "Point" as const, coordinates: [point.lng, point.lat] },
    })),
  };
}

function dgpsPointStyle(feature: Feature<Geometry>, showPending: boolean, showUploaded: boolean) {
  const uploaded = Boolean(feature.get("uploaded"));
  if ((uploaded && !showUploaded) || (!uploaded && !showPending)) return undefined;

  const color = uploaded ? "#10b981" : "#f59e0b";

  return new Style({
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#ffffff", width: 2 }),
    }),
  });
}

function formatRouteTimestamp(raw: string): string {
  const normalized = raw.replace("T", " ").trim();
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  if (match) return `${match[1]} ${match[2]}`;
  return normalized;
}

function normalizeVarianceBand(value: unknown): keyof typeof VARIANCE_BAND_COLORS_SOLID {
  const band = String(value || "green").toLowerCase();
  if (band === "amber" || band === "red") return band;
  return "green";
}

function parcelStyle(feature: Feature<Geometry>, _resolution: number, showVariance: boolean) {
  const fillColor = showVariance
    ? VARIANCE_BAND_COLORS_SOLID[normalizeVarianceBand(feature.get("varianceBand"))]
    : "rgba(0,0,0,0)";
  // Boundaries only — hide survey-number text labels on the mobile map (same idea as DGPS label hide).
  return new Style({
    stroke: new Stroke({ color: PARCEL_BOUNDARY_STROKE, width: 0.65 }),
    fill: new Fill({ color: fillColor }),
  });
}

function routeLineStyle(feature: Feature<Geometry>) {
  const kind = String(feature.get("kind") || "proposed");
  if (kind === "actual") {
    return new Style({
      stroke: new Stroke({
        color: "#ea580c",
        width: 3.5,
        lineCap: "round",
        lineJoin: "round",
      }),
    });
  }
  return new Style({
    stroke: new Stroke({
      color: "#2563eb",
      width: 2.75,
      lineDash: [10, 7],
      lineCap: "round",
      lineJoin: "round",
    }),
  });
}

function routeArrowStyle(feature: Feature<Geometry>) {
  const kind = String(feature.get("kind") || "proposed");
  const heading = Number(feature.get("headingRad") || 0);
  const fill = kind === "actual" ? "#ea580c" : "#2563eb";
  return new Style({
    image: new RegularShape({
      points: 3,
      radius: 7,
      rotation: heading,
      fill: new Fill({ color: fill }),
      stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
    }),
  });
}

function buildRouteFeatures(routes: SurveyorDemoRoute[]) {
  const lineFeatures: Feature<LineString>[] = [];
  const arrowFeatures: Feature<Point>[] = [];

  for (const route of routes) {
    if (route.proposed.length >= 2) {
      lineFeatures.push(
        new Feature({
          geometry: new LineString(route.proposed.map((c) => fromLonLat(c))),
          kind: "proposed",
          routeId: route.id,
        }),
      );
    }
    if (route.actual.length >= 2) {
      lineFeatures.push(
        new Feature({
          geometry: new LineString(route.actual.map((c) => fromLonLat(c))),
          kind: "actual",
          routeId: route.id,
        }),
      );
    }
    for (const arrow of route.arrows) {
      arrowFeatures.push(
        new Feature({
          geometry: new Point(fromLonLat([arrow.lon, arrow.lat])),
          kind: arrow.kind,
          timestamp: arrow.timestamp,
          headingRad: arrow.headingRad,
          routeId: route.id,
          arrowId: arrow.id,
        }),
      );
    }
  }

  return { lineFeatures, arrowFeatures };
}

export default forwardRef<MobileMapViewHandle, Props>(function MobileMapView({
  basemapId,
  showParcels,
  showTrees = true,
  treeLayerMode = "default",
  showVariance,
  showDgps,
  dgpsShowPending,
  dgpsShowUploaded,
  gnssPoints,
  onParcelClick,
  onTreeClick,
  userLocation = null,
  destination = null,
  routeCoords = [],
  locationPickMode = false,
  onMapLocationPick,
  showDemoRoutes = true,
}: Props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const basemapLayersRef = useRef<Record<MobileBasemapId, TileLayer>>({} as Record<MobileBasemapId, TileLayer>);
  const parcelLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const dgpsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const capturedLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLineLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeArrowLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const navRouteLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const userLocationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const destLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeCoordsRef = useRef(routeCoords);
  const userLocationRef = useRef(userLocation);
  const destinationRef = useRef(destination);
  const onParcelClickRef = useRef(onParcelClick);
  const onTreeClickRef = useRef(onTreeClick);
  const onMapLocationPickRef = useRef(onMapLocationPick);
  const locationPickModeRef = useRef(locationPickMode);
  const treeCleanupRef = useRef<(() => void) | null>(null);
  const dgpsFilterRef = useRef({ pending: dgpsShowPending, uploaded: dgpsShowUploaded });
  const showVarianceRef = useRef(showVariance);

  onParcelClickRef.current = onParcelClick;
  onTreeClickRef.current = onTreeClick;
  onMapLocationPickRef.current = onMapLocationPick;
  locationPickModeRef.current = locationPickMode;
  dgpsFilterRef.current = { pending: dgpsShowPending, uploaded: dgpsShowUploaded };
  showVarianceRef.current = showVariance;
  routeCoordsRef.current = routeCoords;
  userLocationRef.current = userLocation;
  destinationRef.current = destination;

  useImperativeHandle(ref, () => ({
    getViewCenter: () => {
      const map = mapRef.current;
      if (!map) return null;
      const [lng, lat] = toLonLat(map.getView().getCenter() ?? [0, 0]);
      return { lat, lng };
    },
    panTo: (location, zoom) => {
      const view = mapRef.current?.getView();
      if (!view) return;
      view.animate({
        center: fromLonLat([location.lng, location.lat]),
        zoom: zoom ?? Math.max(view.getZoom() ?? 16, 17),
        duration: 450,
      });
    },
    fitToCoords: (coords) => {
      const map = mapRef.current;
      if (!map || coords.length < 1) return;
      const extent = boundingExtent(coords.map((c) => fromLonLat([c.lng, c.lat])));
      map.getView().fit(extent, { padding: [48, 48, 72, 48], duration: 500, maxZoom: 18 });
    },
  }));

  const [dataset, setDataset] = useState<RegionDataset>(() =>
    getWorkbenchRegionDatasetSync(DEFAULT_REGION_KEY),
  );

  useEffect(() => {
    let cancelled = false;
    loadWorkbenchRegionDataset(DEFAULT_REGION_KEY).then((next) => {
      if (!cancelled) setDataset(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const target = containerRef.current;
    const tooltipEl = tooltipRef.current;
    if (!target || !tooltipEl) return;

    const format = new GeoJSON();

    const basemapCarto = new TileLayer({
      source: createBasemapSource("basemap-carto"),
      visible: false,
    });
    const basemapOSM = new TileLayer({ source: createBasemapSource("basemap-osm"), visible: true });
    const basemapImagery = new TileLayer({
      source: createBasemapSource("basemap-imagery"),
      visible: false,
    });

    basemapLayersRef.current = {
      "basemap-carto": basemapCarto,
      "basemap-osm": basemapOSM,
      "basemap-imagery": basemapImagery,
    };

    const parcelSource = new VectorSource({
      features: format.readFeatures(dataset.geojson.parcels, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }),
    });

    const parcelLayer = new VectorLayer({
      source: parcelSource,
      zIndex: 9,
      style: (feature, resolution) =>
        parcelStyle(feature as Feature<Geometry>, resolution, showVarianceRef.current),
    });
    parcelLayerRef.current = parcelLayer;

    const dgpsSource = new VectorSource({
      features: format.readFeatures(dataset.geojson.dgps, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }),
    });

    const dgpsLayer = new VectorLayer({
      source: dgpsSource,
      zIndex: 10,
      style: (feature) =>
        dgpsPointStyle(
          feature as Feature<Geometry>,
          dgpsFilterRef.current.pending,
          dgpsFilterRef.current.uploaded,
        ),
    });
    dgpsLayerRef.current = dgpsLayer;

    const capturedSource = new VectorSource();
    const capturedLayer = new VectorLayer({
      source: capturedSource,
      zIndex: 11,
      style: (feature) =>
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: feature.get("synced") ? "#10b981" : "#f59e0b" }),
            stroke: new Stroke({ color: "#ffffff", width: 2 }),
          }),
        }),
    });
    capturedLayerRef.current = capturedLayer;

    const routes = buildDemoSurveyorRoutes(
      dataset.geojson.parcels as GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>,
    );
    const { lineFeatures, arrowFeatures } = buildRouteFeatures(routes);

    const routeLineLayer = new VectorLayer({
      source: new VectorSource({ features: lineFeatures }),
      zIndex: 12,
      style: (feature) => routeLineStyle(feature as Feature<Geometry>),
    });
    routeLineLayerRef.current = routeLineLayer;

    const routeArrowLayer = new VectorLayer({
      source: new VectorSource({ features: arrowFeatures }),
      zIndex: 13,
      style: (feature) => routeArrowStyle(feature as Feature<Geometry>),
    });
    routeArrowLayerRef.current = routeArrowLayer;

    const navRouteLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 20,
      style: new Style({
        stroke: new Stroke({ color: "#2563eb", width: 3, lineCap: "round", lineJoin: "round" }),
      }),
    });
    navRouteLayerRef.current = navRouteLayer;

    const userLocationLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 22,
    });
    userLocationLayerRef.current = userLocationLayer;

    const destLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 21,
    });
    destLayerRef.current = destLayer;

    const tooltipOverlay = new Overlay({
      element: tooltipEl,
      offset: [0, -14],
      positioning: "bottom-center",
      stopEvent: false,
    });

    const pannedCenter = offsetCenterForDefaultPan(
      [SURVEY_ORIGIN.lng, SURVEY_ORIGIN.lat],
      17,
    );
    const initialMaxZoom = getBasemapMaxZoom("basemap-osm");

    const map = new Map({
      target,
      controls: defaultControls({ zoom: false, attribution: false }),
      layers: [
        basemapCarto,
        basemapOSM,
        basemapImagery,
        parcelLayer,
        dgpsLayer,
        capturedLayer,
        routeLineLayer,
        routeArrowLayer,
        navRouteLayer,
        destLayer,
        userLocationLayer,
      ],
      overlays: [tooltipOverlay],
      view: new View({
        center: fromLonLat(pannedCenter),
        zoom: Math.min(17, initialMaxZoom),
        minZoom: 14,
        maxZoom: initialMaxZoom,
      }),
    });

    map.once("rendercomplete", () => {
      // Keep focus on the tree survey block — do not fit distant cadastral extents.
      map.getView().animate({
        center: fromLonLat([SURVEY_ORIGIN.lng, SURVEY_ORIGIN.lat]),
        zoom: Math.min(17, initialMaxZoom),
        duration: 0,
      });
    });

    function hideTooltip() {
      if (!tooltipEl) return;
      tooltipEl.style.display = "none";
      tooltipOverlay.setPosition(undefined);
    }

    function showArrowTooltip(feature: Feature<Geometry>, coordinate: number[]) {
      if (!tooltipEl) return;
      const timestamp = formatRouteTimestamp(String(feature.get("timestamp") || ""));
      const kind = String(feature.get("kind") || "proposed");
      const label = kind === "actual" ? "Actual" : "Proposed";
      tooltipEl.innerHTML = `<div class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-800 shadow-md" style="white-space:nowrap;min-width:max-content"><span class="text-slate-500">${label}</span> · <span class="tabular-nums">${timestamp}</span></div>`;
      tooltipEl.style.display = "block";
      tooltipEl.style.whiteSpace = "nowrap";
      tooltipOverlay.setPosition(coordinate);
    }

    map.on("singleclick", (event) => {
      if (locationPickModeRef.current) {
        const [lng, lat] = toLonLat(event.coordinate);
        onMapLocationPickRef.current?.({ lat, lng });
        hideTooltip();
        return;
      }

      const arrowHit = map.forEachFeatureAtPixel(
        event.pixel,
        (f) => f,
        { layerFilter: (layer) => layer === routeArrowLayer, hitTolerance: 10 },
      ) as Feature<Geometry> | undefined;

      if (arrowHit) {
        showArrowTooltip(arrowHit, event.coordinate);
        return;
      }

      hideTooltip();

      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (f) => f,
        { layerFilter: (layer) => layer === parcelLayer },
      ) as Feature<Geometry> | undefined;

      if (feature) {
        const id = String(feature.get("id") ?? feature.getId() ?? "");
        if (id) onParcelClickRef.current(id);
      }
    });

    map.on("pointermove", (event) => {
      if (event.dragging) return;
      const arrowHit = map.forEachFeatureAtPixel(
        event.pixel,
        (f) => f,
        { layerFilter: (layer) => layer === routeArrowLayer, hitTolerance: 8 },
      ) as Feature<Geometry> | undefined;

      const targetEl = map.getTargetElement();
      if (arrowHit) {
        if (targetEl) targetEl.style.cursor = "pointer";
        showArrowTooltip(arrowHit, event.coordinate);
      } else {
        if (targetEl) targetEl.style.cursor = "";
        hideTooltip();
      }
    });

    mapRef.current = map;

    // Re-paint navigation overlays after map recreate (dataset reload).
    const navSource = navRouteLayer.getSource();
    const liveRoute = routeCoordsRef.current;
    if (navSource && liveRoute.length >= 2) {
      navSource.addFeature(
        new Feature({
          geometry: new LineString(liveRoute.map((c) => fromLonLat([c.lng, c.lat]))),
        }),
      );
    }
    const liveUser = userLocationRef.current;
    if (liveUser) {
      const userFeature = new Feature({
        geometry: new Point(fromLonLat([liveUser.lng, liveUser.lat])),
      });
      userFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: "#2563eb" }),
            stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
          }),
        }),
      );
      userLocationLayer.getSource()?.addFeature(userFeature);
    }
    const liveDest = destinationRef.current;
    if (liveDest) {
      const destFeature = new Feature({
        geometry: new Point(fromLonLat([liveDest.lng, liveDest.lat])),
      });
      destFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: "#111827" }),
            stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
          }),
        }),
      );
      destLayer.getSource()?.addFeature(destFeature);
    }

    return () => {
      treeCleanupRef.current?.();
      treeCleanupRef.current = null;
      map.setTarget(undefined);
      mapRef.current = null;
      parcelLayerRef.current = null;
      dgpsLayerRef.current = null;
      capturedLayerRef.current = null;
      routeLineLayerRef.current = null;
      routeArrowLayerRef.current = null;
      navRouteLayerRef.current = null;
      userLocationLayerRef.current = null;
      destLayerRef.current = null;
    };
  }, [dataset]);

  useEffect(() => {
    routeLineLayerRef.current?.setVisible(showDemoRoutes);
    routeArrowLayerRef.current?.setVisible(showDemoRoutes);
  }, [showDemoRoutes]);

  useEffect(() => {
    const source = navRouteLayerRef.current?.getSource();
    if (!source) return;
    source.clear();
    if (routeCoords.length >= 2) {
      source.addFeature(
        new Feature({
          geometry: new LineString(routeCoords.map((c) => fromLonLat([c.lng, c.lat]))),
        }),
      );
    }
  }, [routeCoords]);

  useEffect(() => {
    const source = userLocationLayerRef.current?.getSource();
    if (!source) return;
    source.clear();
    if (!userLocation) return;
    const feature = new Feature({
      geometry: new Point(fromLonLat([userLocation.lng, userLocation.lat])),
    });
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: "#2563eb" }),
          stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
        }),
      }),
    );
    source.addFeature(feature);
  }, [userLocation]);

  useEffect(() => {
    const source = destLayerRef.current?.getSource();
    if (!source) return;
    source.clear();
    if (!destination) return;
    const feature = new Feature({
      geometry: new Point(fromLonLat([destination.lng, destination.lat])),
    });
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#111827" }),
          stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
        }),
      }),
    );
    source.addFeature(feature);
  }, [destination]);

  useEffect(() => {
    const layers = basemapLayersRef.current;
    if (!layers["basemap-carto"]) return;
    (Object.keys(layers) as MobileBasemapId[]).forEach((id) => {
      layers[id].setVisible(id === basemapId);
    });

    const map = mapRef.current;
    if (!map) return;
    const view = map.getView();
    const maxZoom = getBasemapMaxZoom(basemapId);
    view.setMaxZoom(maxZoom);
    const zoom = view.getZoom();
    if (zoom !== undefined && zoom > maxZoom) {
      view.setZoom(maxZoom);
    }
  }, [basemapId]);

  useEffect(() => {
    parcelLayerRef.current?.setVisible(showParcels);
  }, [showParcels]);

  useEffect(() => {
    const layer = parcelLayerRef.current;
    if (!layer) return;
    layer.setStyle((feature, resolution) =>
      parcelStyle(feature as Feature<Geometry>, resolution, showVarianceRef.current),
    );
    layer.changed();
  }, [showVariance]);

  useEffect(() => {
    dgpsLayerRef.current?.setVisible(showDgps);
    capturedLayerRef.current?.setVisible(showDgps);
  }, [showDgps]);

  useEffect(() => {
    const layer = dgpsLayerRef.current;
    if (!layer) return;
    layer.setStyle((feature) =>
      dgpsPointStyle(feature as Feature<Geometry>, dgpsShowPending, dgpsShowUploaded),
    );
    layer.changed();
  }, [dgpsShowPending, dgpsShowUploaded]);

  useEffect(() => {
    const layer = capturedLayerRef.current;
    const source = layer?.getSource();
    if (!source) return;

    source.clear();
    const format = new GeoJSON();
    const features = format.readFeatures(gnssToFeatures(gnssPoints), {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    source.addFeatures(features);
  }, [gnssPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    treeCleanupRef.current?.();
    treeCleanupRef.current = null;

    if (showTrees) {
      treeCleanupRef.current = attachTreeSurveyLayer(
        map,
        (tree) => onTreeClickRef.current?.(tree),
        treeLayerMode,
      );
    }

    return () => {
      treeCleanupRef.current?.();
      treeCleanupRef.current = null;
    };
  }, [showTrees, treeLayerMode, dataset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    requestAnimationFrame(() => map.updateSize());
  });

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full touch-none bg-slate-200" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-30 whitespace-nowrap"
        style={{ display: "none" }}
      />
    </div>
  );
});
