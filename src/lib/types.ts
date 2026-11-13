export type View = "home" | "map" | "locations" | "manage" | "evaluation";
export type Layer = "priority" | "heat" | "vegetation" | "cluster" | "lisa";
export type Facility =
  "tersedia" | "perlu_perbaikan" | "tidak_tersedia" | "belum_diperiksa";
export interface Area {
  id: string;
  name: string;
  district: string;
  city: string;
  lst: number;
  ndvi: number;
  coverage: number;
  category: number;
  cluster: number;
  lisa: string;
  density: number;
  senior: number;
  center: [number, number];
}
export interface Location {
  id: string;
  code: string;
  name: string;
  areaId: string;
  area: string;
  vendors: number;
  trade: string;
  open: number;
  close: number;
  year: number;
  source: string;
}
export interface Catalog {
  areas: Area[];
  locations: Location[];
  hours: { hour: number; temperature: number }[];
  thresholds: { lst: number; ndvi: number };
  summary: {
    k: number;
    dasar_pilihan?: string;
    silhouette: number;
    Moran_I_LST: number;
    p_Moran_LST_2s: number;
    HH_LISA_setelah_FDR: number;
  };
}
export interface Inspection {
  id: string;
  locationId: string;
  officer: string;
  shade: Facility;
  water: Facility;
  rest: Facility;
  note: string;
  photo?: string;
  createdAt: string;
}
export interface Report {
  id: string;
  locationId: string;
  kind: string;
  note: string;
  status: "baru" | "diproses" | "selesai";
  createdAt: string;
  updatedAt: string;
}
export interface Operations {
  inspections: Inspection[];
  reports: Report[];
}
export const facilityLabels: Record<Facility, string> = {
  tersedia: "Tersedia",
  perlu_perbaikan: "Perlu perbaikan",
  tidak_tersedia: "Belum tersedia",
  belum_diperiksa: "Belum diperiksa",
};
export const categoryLabels = [
  "Panas tinggi · vegetasi rendah",
  "Panas tinggi · vegetasi tinggi",
  "Panas rendah · vegetasi rendah",
  "Panas rendah · vegetasi tinggi",
];
export const categoryColors = ["#d96b36", "#e7b64e", "#c3c9a1", "#647d3c"];
export const clusterColors: Record<number, string> = {
  1: "#df9b42",
  2: "#738754",
  3: "#b9b477",
  4: "#9d7350",
  5: "#6c8b77",
};
export const number = (n: number, digits = 0) =>
  n.toLocaleString("id-ID", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
export const latestInspection = (ops: Operations, locationId: string) =>
  ops.inspections.find((x) => x.locationId === locationId);
