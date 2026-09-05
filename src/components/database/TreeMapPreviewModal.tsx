import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";
import { createBasemapSource, getBasemapMaxZoom } from "../../lib/basemaps";
import { HEALTH_COLORS, type DatabaseTree } from "../../data/treeDatabase";

type Props = {
  tree: DatabaseTree;
  onClose: () => void;
};

export default function TreeMapPreviewModal({ tree, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const feature = new Feature({
      geometry: new Point(fromLonLat([tree.lng, tree.lat])),
    });
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: HEALTH_COLORS[tree.health] }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
      }),
    );

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: createBasemapSource("basemap-osm") }),
        new VectorLayer({ source: new VectorSource({ features: [feature] }) }),
      ],
      view: new View({
        center: fromLonLat([tree.lng, tree.lat]),
        zoom: 17,
        maxZoom: getBasemapMaxZoom("basemap-osm"),
      }),
      controls: [],
    });

    requestAnimationFrame(() => map.updateSize());

    return () => {
      map.setTarget(undefined);
    };
  }, [tree]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {tree.label} · {tree.commonName}
            </p>
            <p className="text-xs text-slate-500">
              {tree.qrTagId} · {tree.range} · {tree.beat}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div ref={mapRef} className="h-64 w-full" />
      </div>
    </div>
  );
}
