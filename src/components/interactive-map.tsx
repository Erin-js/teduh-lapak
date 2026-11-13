"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type ExpressionSpecification,
  type Map as MapType,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Compass, RotateCcw, LoaderCircle, TriangleAlert } from "lucide-react";
import {
  categoryColors,
  clusterColors,
  type Area,
  type Catalog,
  type Layer,
} from "@/lib/types";

const palettes: Record<Layer, ExpressionSpecification> = {
  priority: [
    "match",
    ["get", "category"],
    0,
    categoryColors[0],
    1,
    categoryColors[1],
    2,
    categoryColors[2],
    categoryColors[3],
  ],
  heat: [
    "interpolate",
    ["linear"],
    ["get", "lst"],
    38,
    "#e9e1be",
    42,
    "#efc268",
    44,
    "#e79035",
    46.5,
    "#ba4f2f",
  ],
  vegetation: [
    "interpolate",
    ["linear"],
    ["get", "ndvi"],
    0.1,
    "#e9e2bd",
    0.2,
    "#bdc78a",
    0.3,
    "#758c3e",
    0.47,
    "#344d1f",
  ],
  cluster: [
    "match",
    ["get", "cluster"],
    1, clusterColors[1],
    2, clusterColors[2],
    3, clusterColors[3],
    4, clusterColors[4],
    5, clusterColors[5],
    "#c5cbaa",
  ],
  lisa: [
    "match",
    ["get", "lisa"],
    "High-High",
    "#c06535",
    "Low-Low",
    "#647d3c",
    "High-Low",
    "#e4b84f",
    "Low-High",
    "#a9b894",
    "#dfdfd1",
  ],
};

export default function InteractiveMap({
  catalog,
  layer,
  selected,
  priorityOnly,
  onSelect,
}: {
  catalog: Catalog;
  layer: Layer;
  selected: Area | null;
  priorityOnly: boolean;
  onSelect: (area: Area) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapType | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initialSelection = useRef(selected);
  useEffect(() => {
    if (!container.current) return;
    setLoaded(false);
    setError(false);
    let map: MapType;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#e9ece2" },
            },
          ],
        },
        center: [106.843, -6.203],
        zoom: 10.6,
        minZoom: 9.5,
        maxZoom: 15,
        attributionControl: false,
        maxBounds: [
          [106.5, -6.6],
          [107.21, -5.8],
        ],
      });
    } catch {
      setError(true);
      return;
    }
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Batas: DPMPTSP DKI · Analisis Landsat 2026",
      }),
      "bottom-left",
    );
    map.on("load", async () => {
      try {
        const response = await fetch("/data/jakarta.geojson");
        if (!response.ok) throw new Error("Data peta belum tersedia");
        const geo = await response.json();
        if (mapRef.current !== map) return;
        map.addSource("kelurahan", {
          type: "geojson",
          data: geo,
          promoteId: "id",
        });
        map.addLayer({
          id: "areas-fill",
          type: "fill",
          source: "kelurahan",
          paint: { "fill-color": palettes.priority, "fill-opacity": 0.91 },
        });
        map.addLayer({
          id: "areas-line",
          type: "line",
          source: "kelurahan",
          paint: {
            "line-color": "#f6f4e9",
            "line-width": 0.9,
            "line-opacity": 0.8,
          },
        });
        map.addLayer({
          id: "selected-area",
          type: "line",
          source: "kelurahan",
          filter: ["==", ["get", "id"], ""],
          paint: { "line-color": "#233300", "line-width": 3 },
        });
        const counts = new Map<string, number>();
        catalog.locations.forEach((l) =>
          counts.set(l.areaId, (counts.get(l.areaId) || 0) + 1),
        );
        counts.forEach((count, id) => {
          const area = catalog.areas.find((a) => a.id === id)!;
          const el = document.createElement("button");
          el.className = "loksem-marker";
          el.textContent = String(count);
          el.title = `${count} Loksem di ${area.name}. Posisi mewakili kelurahan.`;
          el.setAttribute("aria-label", el.title);
          el.addEventListener("click", (event) => {
            event.stopPropagation();
            selectRef.current(area);
          });
          new maplibregl.Marker({ element: el })
            .setLngLat(area.center)
            .addTo(map);
        });
        const labels: [string, [number, number]][] = [
          ["JAKARTA UTARA", [106.89, -6.105]],
          ["JAKARTA BARAT", [106.745, -6.17]],
          ["JAKARTA PUSAT", [106.825, -6.165]],
          ["JAKARTA SELATAN", [106.806, -6.285]],
          ["JAKARTA TIMUR", [106.915, -6.255]],
        ];
        labels.forEach(([name, point]) => {
          const el = document.createElement("span");
          el.className = "map-city-label";
          el.textContent = name;
          new maplibregl.Marker({ element: el }).setLngLat(point).addTo(map);
          el.setAttribute("aria-hidden", "true");
          el.setAttribute("tabindex", "-1");
        });
        map.on("click", "areas-fill", (e) => {
          const id = e.features?.[0]?.properties?.id;
          const area = catalog.areas.find((x) => x.id === id);
          if (area) selectRef.current(area);
        });
        map.on("mouseenter", "areas-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "areas-fill", () => {
          map.getCanvas().style.cursor = "";
        });
        if (!initialSelection.current)
          map.fitBounds(
            [
              [106.68, -6.37],
              [106.99, -6.08],
            ],
            { padding: 28, duration: 0 },
          );
        setLoaded(true);
      } catch {
        setError(true);
      }
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [catalog]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !map.getLayer("areas-fill")) return;
    map.setPaintProperty("areas-fill", "fill-color", palettes[layer]);
    map.setFilter(
      "areas-fill",
      priorityOnly ? ["==", ["get", "category"], 0] : null,
    );
    map.setFilter(
      "areas-line",
      priorityOnly ? ["==", ["get", "category"], 0] : null,
    );
  }, [layer, priorityOnly, loaded]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !map.getLayer("selected-area")) return;
    map.setFilter("selected-area", ["==", ["get", "id"], selected?.id || ""]);
    if (selected)
      map.flyTo({
        center: selected.center,
        zoom: 12.3,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 900,
      });
  }, [selected, loaded]);

  return (
    <div className="map-shell">
      <div
        ref={container}
        className="map-canvas"
        aria-label="Peta kelurahan Jakarta interaktif"
      />
      {!loaded && !error && (
        <div className="map-loading">
          <LoaderCircle className="spin" />
          <span>Menyiapkan peta Jakarta…</span>
        </div>
      )}
      {error && (
        <div className="map-loading">
          <TriangleAlert />
          <strong>Peta belum dapat ditampilkan.</strong>
          <p>
            Gunakan daftar kelurahan di samping atau buka dengan browser yang
            mendukung WebGL.
          </p>
        </div>
      )}
      <div className="map-compass">
        <Compass size={25} />
        <span>U</span>
      </div>
      <button
        className="map-reset"
        title="Lihat seluruh Jakarta"
        aria-label="Lihat seluruh Jakarta"
        onClick={() =>
          mapRef.current?.fitBounds(
            [
              [106.68, -6.37],
              [106.99, -6.08],
            ],
            { padding: 28, duration: 700 },
          )
        }
      >
        <RotateCcw size={17} />
      </button>
      <div className="map-water-label">TELUK JAKARTA</div>
      <div className="map-position-note">
        Angka titik = jumlah Loksem per kelurahan.
        <br />
        Bukan koordinat lapak.
      </div>
    </div>
  );
}
