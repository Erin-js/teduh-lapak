"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Droplets,
  ExternalLink,
  FileText,
  Flag,
  Leaf,
  LoaderCircle,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Store,
  Sun,
  Thermometer,
  Trees,
  Umbrella,
  Users,
  X,
  Armchair,
  Info,
  CircleHelp,
} from "lucide-react";
import {
  Area as ChartArea,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StallScene, { BrandMark } from "./stall-scene";
import {
  categoryColors,
  clusterColors,
  categoryLabels,
  facilityLabels,
  latestInspection,
  number,
  type Area,
  type Catalog,
  type Facility,
  type Inspection,
  type Layer,
  type Location,
  type Operations,
  type Report,
  type View,
} from "@/lib/types";

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => (
    <div className="map-placeholder">
      <LoaderCircle className="spin" />
      Menyiapkan peta…
    </div>
  ),
});
const navItems: { view: View; label: string; hash: string }[] = [
  { view: "home", label: "Beranda", hash: "beranda" },
  { view: "map", label: "Peta Teduh", hash: "peta" },
  { view: "locations", label: "Lokasi Lapak", hash: "loksem" },
  { view: "evaluation", label: "Evaluasi", hash: "evaluasi" },
];
const hashes: Record<View, string> = {
  home: "beranda",
  map: "peta",
  locations: "loksem",
  manage: "pengelola",
  evaluation: "evaluasi",
};
const layerOptions: { id: Layer; label: string }[] = [
  { id: "priority", label: "Prioritas awal" },
  { id: "heat", label: "Suhu permukaan" },
  { id: "vegetation", label: "Vegetasi" },
  { id: "cluster", label: "Clustering" },
  { id: "lisa", label: "Spasial · LISA" },
];
const emptyOps: Operations = { inspections: [], reports: [] };
type Modal =
  | { type: "location"; location: Location }
  | { type: "inspection"; location: Location }
  | { type: "report"; location: Location }
  | { type: "sources" }
  | { type: "message" }
  | null;
const dateTime = (date: string) =>
  new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  );
}
function Tag({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`tag ${className}`}>{children}</span>;
}
function SectionIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-intro">
      <span className="eyebrow">
        <span />
        {eyebrow}
      </span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function FacilityRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: Facility;
}) {
  return (
    <div className="facility-row">
      <span>
        {icon}
        {label}
      </span>
      <span className={`facility-status ${value || "belum_diperiksa"}`}>
        <i />
        {facilityLabels[value || "belum_diperiksa"]}
      </span>
    </div>
  );
}
function Dialog({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    el?.querySelector<HTMLElement>(
      'button, input, select, textarea, [tabindex="0"]',
    )?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((x) => x.getClientRects().length);
        if (!items.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose, title]);
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog ${wide ? "dialog-wide" : ""}`}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.22 }}
      >
        <div className="dialog-heading">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function TeduhApp({ catalog }: { catalog: Catalog }) {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ops, setOps] = useState<Operations>(emptyOps);
  const [opsLoaded, setOpsLoaded] = useState(false);
  const [opsError, setOpsError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [layer, setLayer] = useState<Layer>("priority");
  const [areaQuery, setAreaQuery] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [manageTab, setManageTab] = useState<"inspections" | "reports">(
    "inspections",
  );
  const [reportFilter, setReportFilter] = useState("all");
  const [updateId, setUpdateId] = useState("");
  const closeModal = useCallback(() => setModal(null), []);

  const loadOps = useCallback(async () => {
    try {
      const res = await fetch("/api/operations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOps(data);
      setOpsLoaded(true);
      setOpsError("");
    } catch {
      setOpsError("Catatan belum dapat dimuat.");
    }
  }, []);
  useEffect(() => {
    void loadOps();
  }, [loadOps]);
  useEffect(() => {
    function fromHash() {
      const hash = window.location.hash.slice(1);
      const matched = (Object.keys(hashes) as View[]).find(
        (x) => hashes[x] === hash,
      );
      setView(matched || "home");
      setMenuOpen(false);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const navigate = useCallback((next: View) => {
    setView(next);
    setMenuOpen(false);
    window.location.hash = hashes[next];
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const areaById = useMemo(
    () => new Map(catalog.areas.map((a) => [a.id, a])),
    [catalog],
  );
  const inspected = catalog.locations.filter((l) =>
    latestInspection(ops, l.id),
  );
  const ready = catalog.locations.filter((l) => {
    const i = latestInspection(ops, l.id);
    return (
      i &&
      i.shade === "tersedia" &&
      i.water === "tersedia" &&
      i.rest === "tersedia"
    );
  });
  const activeReports = ops.reports.filter((r) => r.status !== "selesai");
  const matchingAreas = useMemo(
    () =>
      catalog.areas
        .filter(
          (a) =>
            (!priorityOnly || a.category === 0) &&
            `${a.name} ${a.district}`
              .toLowerCase()
              .includes(areaQuery.toLowerCase()),
        )
        .sort((a, b) => b.lst - a.lst),
    [catalog, priorityOnly, areaQuery],
  );
  const matchingLocations = catalog.locations.filter((l) => {
    const text = `${l.name} ${l.area} ${l.code}`
      .toLowerCase()
      .includes(locationQuery.toLowerCase());
    return (
      text &&
      (locationFilter === "all" ||
        (locationFilter === "unchecked"
          ? !latestInspection(ops, l.id)
          : !!latestInspection(ops, l.id)))
    );
  });
  const success = (data: Operations, message: string) => {
    setOps(data);
    setOpsLoaded(true);
    closeModal();
    setToast(message);
  };
  async function updateReport(id: string, status: Report["status"]) {
    setUpdateId(id);
    try {
      const res = await fetch("/api/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOps(data);
      setToast("Status laporan diperbarui.");
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Status gagal diperbarui.",
      );
    } finally {
      setUpdateId("");
    }
  }
  function exportRecords() {
    const rows = [
      [
        "jenis",
        "kode_lokasi",
        "waktu_wib",
        "peneduh",
        "air_minum",
        "tempat_jeda",
        "petugas_atau_status",
        "catatan",
      ],
      ...ops.inspections.map((i) => [
        "pemeriksaan",
        catalog.locations.find((l) => l.id === i.locationId)?.code ||
          i.locationId,
        dateTime(i.createdAt),
        facilityLabels[i.shade],
        facilityLabels[i.water],
        facilityLabels[i.rest],
        i.officer,
        i.note,
      ]),
      ...ops.reports.map((r) => [
        "laporan " + r.kind,
        catalog.locations.find((l) => l.id === r.locationId)?.code ||
          r.locationId,
        dateTime(r.createdAt),
        "",
        "",
        "",
        r.status,
        r.note,
      ]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map(
              (v) =>
                '"' +
                String(/^[=+@\-\t\r]/.test(String(v)) ? "'" + v : v).replaceAll(
                  '"',
                  '""',
                ) +
                '"',
            )
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "catatan-teduh-lapak.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Catatan berhasil diekspor.");
  }

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Lewati ke isi
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="TEDUH LAPAK, ke beranda"
          >
            <span className="brand-icon">
              <BrandMark />
            </span>
            <span>
              teduh<span className="brand-light">lapak</span>
              <small>RUANG TEDUH BERSAMA</small>
            </span>
          </button>
          <nav
            aria-label="Navigasi utama"
            className={menuOpen ? "nav-open" : ""}
          >
            {navItems.map((item) => (
              <button
                key={item.view}
                aria-current={view === item.view ? "page" : undefined}
                className={view === item.view ? "active" : ""}
                onClick={() => navigate(item.view)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            className={`button header-cta ${view === "manage" ? "selected" : ""}`}
            onClick={() => navigate("manage")}
          >
            <ClipboardCheck size={17} />
            <span>Ruang Pengelola</span>
            <ArrowUpRight size={16} />
          </button>
          <button
            className="menu-toggle icon-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {opsError && (
        <div className="connection-note" role="alert">
          {opsError}
          <button onClick={() => void loadOps()}>Coba lagi</button>
        </div>
      )}
      <main id="main" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
          >
            {view === "home" && (
              <>
                <section className="hero page-width">
                  <div className="hero-copy">
                    <Reveal>
                      <Tag className="hero-tag">
                        <span className="status-dot" />
                        DARI PETA PANAS, MENUJU LAPAK TEDUH
                      </Tag>
                      <h1>
                        Ruang teduh.
                        <br />
                        Usaha tetap
                        <br />
                        <span className="word-grow">
                          tumbuh.
                          <svg viewBox="0 0 270 16" aria-hidden="true">
                            <path d="M4 11c69-11 170-11 260-2" />
                          </svg>
                        </span>
                        <span className="hero-flower" aria-hidden="true">
                          ✳
                        </span>
                      </h1>
                      <p>
                        Karena mencari nafkah layak ditemani rasa nyaman. Mari
                        hadirkan peneduh, air minum, dan tempat jeda lebih dekat
                        dengan lapak.
                      </p>
                      <div className="hero-actions">
                        <button
                          className="button button-primary"
                          onClick={() => navigate("map")}
                        >
                          Jelajahi Peta Teduh
                          <ArrowUpRight size={19} />
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            document
                              .getElementById("cara-kerja")
                              ?.scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          Kenali caranya
                          <ArrowDown size={16} />
                        </button>
                      </div>
                      <div className="hero-footnote">
                        <span className="tiny-location">
                          <MapPin size={14} />
                        </span>
                        <span>
                          Berangkat dari Jakarta. Bertumbuh bersama pedagang.
                        </span>
                      </div>
                    </Reveal>
                  </div>
                  <Reveal className="hero-art" delay={0.1}>
                    <div className="art-top-label">
                      <span className="art-label-icon">
                        <Umbrella size={20} />
                      </span>
                      <span>
                        Lebih teduh,
                        <br />
                        <strong>lebih nyaman.</strong>
                      </span>
                      <svg viewBox="0 0 70 60" aria-hidden="true">
                        <path d="M5 7c30-7 50 13 42 37m-11-9 10 11 11-9" />
                      </svg>
                    </div>
                    <StallScene />
                    <div className="art-bottom-label">
                      <span className="water-icon">
                        <Droplets size={20} />
                      </span>
                      <div>
                        <strong>Jeda sejenak itu berarti.</strong>
                        <span>Air minum & ruang istirahat dekat lapak</span>
                      </div>
                      <span className="label-check">
                        <Check size={13} />
                      </span>
                    </div>
                    <span className="illustration-note">
                      Ilustrasi usulan fasilitas
                    </span>
                  </Reveal>
                </section>
                <section
                  className="stats-wrap page-width"
                  aria-label="Ringkasan data analisis"
                >
                  <div className="stats-intro">
                    <span className="eyebrow">MEMBACA KOTA</span>
                    <p>
                      Data sebagai awal.
                      <br />
                      <strong>Manusia sebagai tujuan.</strong>
                    </p>
                  </div>
                  {[
                    ["261", "kelurahan dianalisis", "Landsat · 2026"],
                    [
                      "89",
                      "calon wilayah peninjauan",
                      "Panas tinggi, vegetasi rendah",
                    ],
                    [
                      "10",
                      "Loksem di Pulo Gadung",
                      "Catatan administratif · 2023",
                    ],
                    [
                      "436",
                      "pedagang tercatat",
                      "Kehadiran aktual belum diukur",
                    ],
                  ].map(([value, label, note]) => (
                    <div className="stat" key={label}>
                      <strong>
                        {value}
                        <span>
                          {value === "89" ? (
                            <Leaf size={18} />
                          ) : value === "10" ? (
                            <Store size={18} />
                          ) : value === "436" ? (
                            <Users size={18} />
                          ) : (
                            <MapPin size={18} />
                          )}
                        </span>
                      </strong>
                      <span>{label}</span>
                      <small>{note}</small>
                    </div>
                  ))}
                </section>
                <section className="home-map-section page-width">
                  <Reveal className="map-invitation">
                    <div className="map-invitation-copy">
                      <span className="eyebrow light">
                        <span />
                        01 / KENALI WILAYAHNYA
                      </span>
                      <h2>
                        Satu kota.
                        <br />
                        Rasa panas
                        <br /> yang berbeda.
                      </h2>
                      <p>
                        Peta membantu kita melihat pola panas dan vegetasi.
                        Pemeriksaan lapangan membantu memahami kebutuhan lapak
                        yang sebenarnya.
                      </p>
                      <button
                        className="button button-cream"
                        onClick={() => navigate("map")}
                      >
                        Temukan wilayah di peta
                        <ArrowUpRight size={18} />
                      </button>
                      <span className="invitation-note">
                        Suhu permukaan ≠ suhu udara
                      </span>
                    </div>
                    <div className="map-invitation-art">
                      <MiniJakarta catalog={catalog} />
                      <div className="mini-map-label">
                        <span className="status-dot" />
                        89 kelurahan untuk peninjauan awal
                      </div>
                      <span className="mini-map-scale">
                        JAKARTA · 261 KELURAHAN
                      </span>
                    </div>
                  </Reveal>
                </section>
                <section
                  id="cara-kerja"
                  className="solutions-section page-width"
                >
                  <Reveal>
                    <div className="section-head">
                      <SectionIntro
                        eyebrow="02 / DEKATKAN PERLINDUNGAN"
                        title="Tiga kebutuhan. Satu titik teduh."
                      >
                        Perlindungan dimulai dari hal sederhana yang bisa
                        dijangkau selama jam usaha.
                      </SectionIntro>
                      <span className="handwritten">
                        dekat lapak,
                        <br />
                        dekat manfaatnya ↙
                      </span>
                    </div>
                  </Reveal>
                  <div className="solution-grid">
                    {[
                      {
                        no: "01",
                        icon: <Umbrella />,
                        title: "Peneduh yang melindungi",
                        text: "Area berjualan yang terlindung dari matahari, dengan aliran udara dan akses yang tetap terjaga.",
                        className: "shade",
                      },
                      {
                        no: "02",
                        icon: <Droplets />,
                        title: "Air minum yang dekat",
                        text: "Titik air minum yang mudah dijangkau, dengan ketersediaan yang diperiksa pengelola.",
                        className: "water",
                      },
                      {
                        no: "03",
                        icon: <Armchair />,
                        title: "Ruang untuk mengambil jeda",
                        text: "Tempat duduk di area teduh untuk beristirahat, disesuaikan dengan kegiatan usaha pedagang.",
                        className: "rest",
                      },
                    ].map((s, i) => (
                      <Reveal
                        key={s.no}
                        delay={i * 0.08}
                        className={`solution-card ${s.className}`}
                      >
                        <div className="solution-top">
                          <span className="solution-icon">{s.icon}</span>
                          <span>{s.no}</span>
                        </div>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                        <span className="solution-bottom">
                          DIRANCANG BERSAMA PEDAGANG
                          <ArrowUpRight size={17} />
                        </span>
                      </Reveal>
                    ))}
                  </div>
                </section>
                <section className="time-section page-width">
                  <Reveal className="time-copy">
                    <span className="eyebrow">
                      <span />
                      03 / PERHATIKAN WAKTUNYA
                    </span>
                    <h2>
                      Siang terasa panjang.
                      <br />
                      Jangan jauh dari teduh.
                    </h2>
                    <p>
                      Seluruh jadwal 10 Loksem mencakup pukul{" "}
                      <strong>11.00–15.00 WIB</strong>. Rentang ini menjadi
                      fokus pengamatan awal, sambil tetap memperhatikan kondisi
                      sepanjang jam usaha.
                    </p>
                    <Tag>
                      <Clock3 size={15} />
                      Jadwal administratif 2023
                    </Tag>
                  </Reveal>
                  <Reveal className="time-chart">
                    <div className="chart-heading">
                      <span>Suhu udara rata-rata menurut jam</span>
                      <Tag>SEKITAR MONAS</Tag>
                    </div>
                    <HourlyChart catalog={catalog} />
                    <p className="data-note">
                      NASA POWER · Juli–Oktober 2026. Rata-rata historis, bukan
                      cuaca langsung atau ambang keselamatan.
                    </p>
                  </Reveal>
                </section>
                <section className="journey-section page-width">
                  <Reveal>
                    <SectionIntro
                      eyebrow="04 / DARI TEMUAN KE TINDAKAN"
                      title="Mulai kecil. Periksa. Perbaiki."
                    />
                    <div className="journey-steps">
                      {[
                        ["01", "Petakan", "Kenali pola wilayah melalui data."],
                        ["02", "Periksa", "Dengarkan pedagang, amati lapak."],
                        [
                          "03",
                          "Lindungi",
                          "Sesuaikan fasilitas dengan kebutuhan.",
                        ],
                        ["04", "Evaluasi", "Catat manfaat dan kendalanya."],
                      ].map(([n, t, d]) => (
                        <div key={n}>
                          <span className="step-number">{n}</span>
                          <h3>{t}</h3>
                          <p>{d}</p>
                        </div>
                      ))}
                    </div>
                  </Reveal>
                </section>
                <section className="bottom-cta page-width">
                  <div>
                    <Sprout size={36} />
                    <h2>
                      Lapak yang lebih teduh
                      <br />
                      dimulai dari satu langkah.
                    </h2>
                  </div>
                  <button
                    className="button button-primary"
                    onClick={() => navigate("locations")}
                  >
                    Kenali lokasi lapak
                    <ArrowUpRight size={18} />
                  </button>
                </section>
              </>
            )}

            {view === "map" && (
              <div className="page-width app-page map-page">
                <PageHeading
                  eyebrow="PETA TEDUH / JAKARTA"
                  title="Kenali panasnya. Temukan kebutuhannya."
                  description="Jelajahi pola kelurahan sebagai awal pemeriksaan lapangan."
                  action={
                    <button
                      className="button button-outline small-button"
                      onClick={() => setModal({ type: "sources" })}
                    >
                      <CircleHelp size={16} />
                      Tentang data
                    </button>
                  }
                />
                <div className="layer-bar">
                  <span>
                    <SlidersHorizontal size={16} />
                    Tampilan peta
                  </span>
                  <div
                    className="layer-options"
                    role="group"
                    aria-label="Pilih lapisan peta"
                  >
                    {layerOptions.map((l) => (
                      <button
                        key={l.id}
                        aria-pressed={layer === l.id}
                        className={layer === l.id ? "active" : ""}
                        onClick={() => setLayer(l.id)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="map-workspace">
                  <div className="map-main">
                    <InteractiveMap
                      catalog={catalog}
                      layer={layer}
                      selected={selectedArea}
                      onSelect={setSelectedArea}
                      priorityOnly={priorityOnly}
                    />
                    <MapLegend layer={layer} catalog={catalog} />
                  </div>
                  <aside className="map-sidebar">
                    <div className="map-search">
                      <Search size={17} />
                      <input
                        aria-label="Cari kelurahan atau kecamatan"
                        placeholder="Cari kelurahan…"
                        value={areaQuery}
                        onChange={(e) => setAreaQuery(e.target.value)}
                      />
                      {areaQuery && (
                        <button
                          className="icon-button"
                          aria-label="Hapus pencarian"
                          onClick={() => setAreaQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <label className="filter-check">
                      <input
                        type="checkbox"
                        checked={priorityOnly}
                        onChange={(e) => setPriorityOnly(e.target.checked)}
                      />
                      <span>Hanya 89 calon wilayah peninjauan</span>
                    </label>
                    {selectedArea ? (
                      <div className="area-detail">
                        <div className="area-detail-top">
                          <span className="eyebrow">KELURAHAN TERPILIH</span>
                          <button
                            className="icon-button"
                            aria-label="Tutup detail kelurahan"
                            onClick={() => setSelectedArea(null)}
                          >
                            <X size={17} />
                          </button>
                        </div>
                        <h3>{selectedArea.name}</h3>
                        <p>
                          {selectedArea.district} · {selectedArea.city}
                        </p>
                        <Tag className="category-tag">
                          <i
                            style={{
                              background: categoryColors[selectedArea.category],
                            }}
                          />
                          {categoryLabels[selectedArea.category]}
                        </Tag>
                        <div className="area-metrics">
                          <div>
                            <Thermometer size={19} />
                            <strong>
                              {number(selectedArea.lst, 2)}
                              <small>°C</small>
                            </strong>
                            <span>Suhu permukaan</span>
                          </div>
                          <div>
                            <Leaf size={19} />
                            <strong>{number(selectedArea.ndvi, 3)}</strong>
                            <span>Indeks vegetasi</span>
                          </div>
                        </div>
                        <div className="detail-line">
                          <span>Klaster K-Means</span>
                          <strong>Kelompok {selectedArea.cluster}</strong>
                        </div>
                        <div className="detail-line">
                          <span>LISA · FDR 5%</span>
                          <strong>{selectedArea.lisa}</strong>
                        </div>
                        <p className="data-note">
                          Komposit Landsat Agustus–September 2026. Nilai
                          mewakili kelurahan, bukan pengukuran di lapak.
                        </p>
                        <div className="area-locations">
                          <span className="eyebrow">LOKSEM DALAM DATA</span>
                          {catalog.locations
                            .filter((l) => l.areaId === selectedArea.id)
                            .map((l) => (
                              <button
                                key={l.id}
                                onClick={() =>
                                  setModal({ type: "location", location: l })
                                }
                              >
                                <span>
                                  <Store size={16} />
                                  <span>
                                    <strong>{l.code}</strong>
                                    <small>{l.name}</small>
                                  </span>
                                </span>
                                <ChevronRight size={17} />
                              </button>
                            ))}
                          {!catalog.locations.some(
                            (l) => l.areaId === selectedArea.id,
                          ) && (
                            <p>
                              Daftar Loksem yang dimuat hanya mencakup Pulo
                              Gadung. Tidak ada catatan lokasi untuk kelurahan
                              ini dalam data tersebut.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="area-list">
                        <div className="list-label">
                          <strong>{matchingAreas.length} kelurahan</strong>
                          <span>Urut suhu permukaan</span>
                        </div>
                        {matchingAreas
                          .slice(0, areaQuery ? 261 : 35)
                          .map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setSelectedArea(a)}
                            >
                              <span
                                className="area-color"
                                style={{
                                  background: categoryColors[a.category],
                                }}
                              />
                              <span>
                                <strong>{a.name}</strong>
                                <small>{a.district}</small>
                              </span>
                              <span className="area-temp">
                                {number(a.lst, 1)}°<ChevronRight size={14} />
                              </span>
                            </button>
                          ))}
                        {matchingAreas.length === 0 && (
                          <p className="no-results">
                            Tidak ada kelurahan yang sesuai. Coba nama lain atau
                            ubah filter.
                          </p>
                        )}
                        {!areaQuery && matchingAreas.length > 35 && (
                          <p className="data-note">
                            Menampilkan 35 teratas. Cari nama untuk menjelajahi
                            semua kelurahan.
                          </p>
                        )}
                      </div>
                    )}
                  </aside>
                </div>
                <div className="context-note">
                  <Info size={17} />
                  <p>
                    Prioritas awal menggunakan median panas dan vegetasi.
                    Clustering menggunakan empat indikator; LISA menunjukkan
                    pola ketetanggaan. Ketiganya berbeda dan bukan kategori
                    bahaya kesehatan resmi.
                  </p>
                </div>
              </div>
            )}

            {view === "locations" && (
              <div className="page-width app-page">
                <PageHeading
                  eyebrow="LOKASI LAPAK / PULO GADUNG"
                  title="Kenali lapaknya. Dekatkan perlindungannya."
                  description="Sepuluh Loksem sebagai awal penjajakan kebutuhan fasilitas."
                />
                <div className="locations-summary">
                  <div>
                    <Store />
                    <strong>10</strong>
                    <span>Loksem dalam data</span>
                  </div>
                  <div>
                    <Users />
                    <strong>436</strong>
                    <span>pedagang tercatat · 2023</span>
                  </div>
                  <div>
                    <Clock3 />
                    <strong>11–15</strong>
                    <span>WIB · irisan seluruh jadwal</span>
                  </div>
                  <div>
                    <ClipboardCheck />
                    <strong>{opsLoaded ? inspected.length : "—"}/10</strong>
                    <span>Loksem sudah dicatat</span>
                  </div>
                </div>
                <div className="collection-toolbar">
                  <label className="search-input">
                    <Search size={18} />
                    <input
                      placeholder="Cari nama jalan, kelurahan, atau kode…"
                      aria-label="Cari Loksem"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                  </label>
                  <label className="select-wrap">
                    <select
                      aria-label="Filter pemeriksaan Loksem"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="all">Semua lokasi</option>
                      <option value="unchecked">Belum dicatat</option>
                      <option value="checked">Sudah dicatat</option>
                    </select>
                    <ChevronDown size={16} />
                  </label>
                </div>
                <div className="location-grid">
                  {matchingLocations.map((l, i) => (
                    <LocationCard
                      key={l.id}
                      location={l}
                      inspection={latestInspection(ops, l.id)}
                      index={i}
                      onOpen={() => setModal({ type: "location", location: l })}
                    />
                  ))}
                </div>
                {!matchingLocations.length && (
                  <EmptyState icon={<Search />} title="Lokasi belum ditemukan">
                    Coba kata pencarian lain atau tampilkan semua lokasi.
                  </EmptyState>
                )}
                <div className="context-note">
                  <Info size={17} />
                  <p>
                    Alamat, jadwal, dan jumlah pedagang berasal dari daftar
                    administratif 2023. Kondisi fasilitas serta kehadiran
                    pedagang belum disurvei. Catatan prototipe tidak
                    menggantikan verifikasi lapangan.
                  </p>
                </div>
              </div>
            )}

            {view === "manage" && (
              <div className="page-width app-page">
                <PageHeading
                  eyebrow="RUANG PENGELOLA"
                  title="Perhatian kecil. Perlindungan yang terjaga."
                  description="Catat kondisi fasilitas dan tindak lanjuti kebutuhan di sekitar lapak."
                  action={
                    <Tag className="local-tag">
                      <span className="status-dot" />
                      Prototipe lokal · tanpa akun
                    </Tag>
                  }
                />
                <div className="manage-summary">
                  <SummaryCard
                    icon={<ClipboardCheck />}
                    value={`${opsLoaded ? inspected.length : "—"}/10`}
                    label="Loksem sudah dicatat"
                    note="Berdasarkan catatan terbaru"
                  />
                  <SummaryCard
                    icon={<ShieldCheck />}
                    value={opsLoaded ? String(ready.length) : "—"}
                    label="Tiga fasilitas tersedia"
                    note="Peneduh, air, dan tempat jeda"
                  />
                  <SummaryCard
                    icon={<Flag />}
                    value={opsLoaded ? String(activeReports.length) : "—"}
                    label="Laporan belum selesai"
                    note="Baru dan sedang diproses"
                  />
                  <div className="info-message">
                    <Bell size={23} />
                    <div>
                      <strong>Informasi yang bisa ditindaklanjuti.</strong>
                      <p>
                        Belum terhubung ke peringatan panas langsung. Siapkan
                        pesan operasional untuk pengelola.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => setModal({ type: "message" })}
                      >
                        Siapkan pesan
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="manage-toolbar">
                  <div className="tab-group">
                    <button
                      className={manageTab === "inspections" ? "active" : ""}
                      onClick={() => setManageTab("inspections")}
                    >
                      <ClipboardCheck size={16} />
                      Pemeriksaan lokasi
                    </button>
                    <button
                      className={manageTab === "reports" ? "active" : ""}
                      onClick={() => setManageTab("reports")}
                    >
                      <MessageSquare size={16} />
                      Laporan
                      <span className="count-badge">{ops.reports.length}</span>
                    </button>
                  </div>
                  <button
                    className="button button-outline small-button"
                    onClick={exportRecords}
                    disabled={!ops.inspections.length && !ops.reports.length}
                  >
                    <ArrowDownToLine size={16} />
                    Ekspor catatan
                  </button>
                </div>
                {manageTab === "inspections" ? (
                  <div className="table-scroll">
                    <table className="inspection-table">
                      <thead>
                        <tr>
                          <th>Lokasi usaha</th>
                          <th>Peneduh</th>
                          <th>Air minum</th>
                          <th>Tempat jeda</th>
                          <th>Catatan terakhir</th>
                          <th>
                            <span className="sr-only">Tindakan</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.locations.map((l) => {
                          const inspection = latestInspection(ops, l.id);
                          return (
                            <tr key={l.id}>
                              <td>
                                <button
                                  className="table-location"
                                  onClick={() =>
                                    setModal({ type: "location", location: l })
                                  }
                                >
                                  <strong>
                                    {l.code}
                                    <span>{l.name}</span>
                                  </strong>
                                  <small>{l.area}</small>
                                </button>
                              </td>
                              {(["shade", "water", "rest"] as const).map(
                                (f) => (
                                  <td key={f}>
                                    <span
                                      className={`table-status ${inspection?.[f] || "belum_diperiksa"}`}
                                    >
                                      <i />
                                      {
                                        facilityLabels[
                                          inspection?.[f] || "belum_diperiksa"
                                        ]
                                      }
                                    </span>
                                  </td>
                                ),
                              )}
                              <td>
                                <span className="table-date">
                                  {inspection
                                    ? dateTime(inspection.createdAt)
                                    : "Belum ada catatan"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="button button-outline tiny-button"
                                  onClick={() =>
                                    setModal({
                                      type: "inspection",
                                      location: l,
                                    })
                                  }
                                >
                                  <Plus size={14} />
                                  Catat
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <div className="report-toolbar">
                      <label className="select-wrap">
                        <select
                          aria-label="Filter status laporan"
                          value={reportFilter}
                          onChange={(e) => setReportFilter(e.target.value)}
                        >
                          <option value="all">Semua status</option>
                          <option value="baru">Baru</option>
                          <option value="diproses">Diproses</option>
                          <option value="selesai">Selesai</option>
                        </select>
                        <ChevronDown size={16} />
                      </label>
                      <button
                        className="button button-primary small-button"
                        onClick={() =>
                          setModal({
                            type: "report",
                            location: catalog.locations[0],
                          })
                        }
                      >
                        <Plus size={16} />
                        Buat laporan
                      </button>
                    </div>
                    {ops.reports.filter(
                      (r) =>
                        reportFilter === "all" || r.status === reportFilter,
                    ).length ? (
                      <div className="reports-list">
                        {ops.reports
                          .filter(
                            (r) =>
                              reportFilter === "all" ||
                              r.status === reportFilter,
                          )
                          .map((r) => (
                            <article className="report-card" key={r.id}>
                              <div className="report-icon">
                                {r.kind === "Air minum" ? (
                                  <Droplets />
                                ) : r.kind === "Peneduh" ? (
                                  <Umbrella />
                                ) : r.kind === "Tempat jeda" ? (
                                  <Armchair />
                                ) : (
                                  <Flag />
                                )}
                              </div>
                              <div className="report-content">
                                <Tag>{r.kind}</Tag>
                                <h3>
                                  {
                                    catalog.locations.find(
                                      (l) => l.id === r.locationId,
                                    )?.code
                                  }{" "}
                                  ·{" "}
                                  {
                                    catalog.locations.find(
                                      (l) => l.id === r.locationId,
                                    )?.name
                                  }
                                </h3>
                                <p>{r.note}</p>
                                <small>{dateTime(r.createdAt)}</small>
                              </div>
                              <label className="select-wrap">
                                <select
                                  aria-label={`Status laporan ${r.kind}`}
                                  disabled={updateId === r.id}
                                  value={r.status}
                                  onChange={(e) =>
                                    void updateReport(
                                      r.id,
                                      e.target.value as Report["status"],
                                    )
                                  }
                                >
                                  <option value="baru">Baru</option>
                                  <option value="diproses">Diproses</option>
                                  <option value="selesai">Selesai</option>
                                </select>
                                <ChevronDown size={15} />
                              </label>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<MessageSquare />}
                        title={
                          reportFilter === "all"
                            ? "Belum ada laporan masuk."
                            : "Tidak ada laporan dengan status ini."
                        }
                      >
                        Laporan fasilitas akan muncul di sini untuk
                        ditindaklanjuti pengelola.
                      </EmptyState>
                    )}
                  </>
                )}
                <p className="local-footnote">
                  <Info size={15} />
                  Catatan disimpan di komputer ini. Ruang pengelola merupakan
                  prototipe lokal dan belum memakai autentikasi multi-pengguna.
                </p>
              </div>
            )}

            {view === "evaluation" && (
              <div className="page-width app-page">
                <PageHeading
                  eyebrow="EVALUASI / BELAJAR DARI LAPANGAN"
                  title="Bukan sekadar tersedia. Perlu diperiksa."
                  description="Pantau pencatatan fasilitas dan tindak lanjut. Dampak intervensi baru dinilai setelah pengukuran lapangan."
                  action={
                    <button
                      disabled={!ops.inspections.length && !ops.reports.length}
                      className="button button-outline small-button"
                      onClick={exportRecords}
                    >
                      <ArrowDownToLine size={16} />
                      Ekspor catatan
                    </button>
                  }
                />
                <div className="evaluation-overview">
                  <div className="evaluation-feature">
                    <span className="eyebrow light">CAKUPAN PENCATATAN</span>
                    <div className="evaluation-big">
                      {inspected.length}
                      <span>/ 10</span>
                    </div>
                    <h3>Loksem sudah dicatat</h3>
                    <div className="progress-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${inspected.length * 10}%` }}
                      />
                    </div>
                    <p>
                      {10 - inspected.length} lokasi belum memiliki catatan
                      pemeriksaan.
                    </p>
                    <button
                      className="button button-cream"
                      onClick={() => navigate("manage")}
                    >
                      Mulai pemeriksaan
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="readiness-card">
                    <h3>Kesiapan tiga fasilitas</h3>
                    <p>Catatan terbaru setiap lokasi · dari 10 Loksem</p>
                    {[
                      {
                        key: "shade" as const,
                        label: "Peneduh",
                        icon: <Umbrella />,
                      },
                      {
                        key: "water" as const,
                        label: "Air minum",
                        icon: <Droplets />,
                      },
                      {
                        key: "rest" as const,
                        label: "Tempat jeda",
                        icon: <Armchair />,
                      },
                    ].map((f) => {
                      const count = catalog.locations.filter(
                        (l) =>
                          latestInspection(ops, l.id)?.[f.key] === "tersedia",
                      ).length;
                      return (
                        <div className="readiness-row" key={f.key}>
                          <span>
                            {f.icon}
                            {f.label}
                            <strong>{count}/10 tersedia</strong>
                          </span>
                          <div className="readiness-track">
                            {catalog.locations.map((l) => (
                              <span
                                key={l.id}
                                className={
                                  latestInspection(ops, l.id)?.[f.key] ||
                                  "belum_diperiksa"
                                }
                                title={`${l.code}: ${facilityLabels[latestInspection(ops, l.id)?.[f.key] || "belum_diperiksa"]}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="readiness-legend">
                      <span>
                        <i className="tersedia" />
                        Tersedia
                      </span>
                      <span>
                        <i className="perlu_perbaikan" />
                        Perlu perbaikan
                      </span>
                      <span>
                        <i className="tidak_tersedia" />
                        Belum tersedia
                      </span>
                      <span>
                        <i />
                        Belum diperiksa
                      </span>
                    </div>
                  </div>
                </div>
                <div className="evaluation-small">
                  <SummaryCard
                    icon={<ClipboardCheck />}
                    value={String(ops.inspections.length)}
                    label="catatan pemeriksaan"
                    note="Seluruh riwayat tersimpan"
                  />
                  <SummaryCard
                    icon={<CheckCircle2 />}
                    value={`${ops.reports.filter((r) => r.status === "selesai").length}/${ops.reports.length}`}
                    label="laporan diselesaikan"
                    note="Status diperbarui pengelola"
                  />
                  <SummaryCard
                    icon={<Trees />}
                    value="Belum diukur"
                    label="dampak perlindungan"
                    note="Tidak ada klaim penurunan suhu"
                  />
                </div>
                <div className="evaluation-plan">
                  <SectionIntro
                    eyebrow="RENCANA EVALUASI"
                    title="Apa yang perlu dipelajari berikutnya?"
                  />
                  <div className="evaluation-plan-grid">
                    <div>
                      <span>01</span>
                      <h3>Fasilitas berfungsi</h3>
                      <p>
                        Periksa ketersediaan air, kelayakan peneduh, dan
                        kemudahan mengakses tempat jeda.
                      </p>
                    </div>
                    <div>
                      <span>02</span>
                      <h3>Pedagang terbantu</h3>
                      <p>
                        Catat penggunaan, kenyamanan, kendala, dan masukan
                        pedagang tanpa menganggapnya sebagai diagnosis medis.
                      </p>
                    </div>
                    <div>
                      <span>03</span>
                      <h3>Kondisi dibandingkan</h3>
                      <p>
                        Ukur sebelum–sesudah pada jam dan cuaca yang sebanding,
                        idealnya dengan lokasi pembanding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="site-footer page-width">
        <button className="brand footer-brand" onClick={() => navigate("home")}>
          <span className="brand-icon">
            <BrandMark />
          </span>
          <span>
            teduh<span className="brand-light">lapak</span>
          </span>
        </button>
        <span>Dari peta panas ke lapak yang terlindungi.</span>
        <div>
          <button onClick={() => setModal({ type: "sources" })}>
            Sumber & metode
            <ArrowUpRight size={13} />
          </button>
          <small>PROTOTIPE · JAKARTA</small>
        </div>
      </footer>
      <div className="toast-region" role="status" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              className="toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <CheckCircle2 size={20} />
              {toast}
              <button
                aria-label="Tutup pemberitahuan"
                onClick={() => setToast("")}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {modal && (
          <Dialog
            title={
              modal.type === "sources"
                ? "Di balik peta dan angka."
                : modal.type === "message"
                  ? "Informasi yang mengajak bertindak."
                  : modal.type === "inspection"
                    ? "Catat kondisi lapak."
                    : modal.type === "report"
                      ? "Sampaikan kebutuhan lapak."
                      : modal.location.name
            }
            eyebrow={
              modal.type === "sources"
                ? "SUMBER & METODE"
                : modal.type === "message"
                  ? "PESAN OPERASIONAL"
                  : modal.type === "report"
                    ? "LAPORAN FASILITAS"
                    : `${modal.location.code} · ${modal.location.area}`
            }
            onClose={closeModal}
            wide={modal.type === "sources"}
          >
            {modal.type === "location" && (
              <LocationDetails
                catalog={catalog}
                location={modal.location}
                inspection={latestInspection(ops, modal.location.id)}
                onInspect={() =>
                  setModal({ type: "inspection", location: modal.location })
                }
                onReport={() =>
                  setModal({ type: "report", location: modal.location })
                }
                onMap={() => {
                  setSelectedArea(areaById.get(modal.location.areaId) || null);
                  setModal(null);
                  navigate("map");
                }}
              />
            )}
            {modal.type === "inspection" && (
              <InspectionForm
                key={modal.location.id}
                location={modal.location}
                previous={latestInspection(ops, modal.location.id)}
                onSuccess={(data) =>
                  success(
                    data,
                    "Pemeriksaan disimpan. Terima kasih sudah memperhatikan lapak.",
                  )
                }
                onCancel={closeModal}
              />
            )}
            {modal.type === "report" && (
              <ReportForm
                locations={catalog.locations}
                initialLocation={modal.location}
                onSuccess={(data) =>
                  success(data, "Laporan tersimpan dan siap ditindaklanjuti.")
                }
                onCancel={closeModal}
              />
            )}
            {modal.type === "sources" && <Sources catalog={catalog} />}
            {modal.type === "message" && (
              <MessageComposer
                onCopied={() =>
                  setToast("Pesan disalin. Pilih kanal pengiriman yang sesuai.")
                }
              />
            )}
          </Dialog>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          <span />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function SummaryCard({
  icon,
  value,
  label,
  note,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  note: string;
}) {
  return (
    <div className="summary-card">
      <span className="summary-icon">{icon}</span>
      <strong className={value.length > 10 ? "small-value" : ""}>
        {value}
      </strong>
      <span>{label}</span>
      <small>{note}</small>
    </div>
  );
}
function LocationCard({
  location: l,
  inspection,
  index,
  onOpen,
}: {
  location: Location;
  inspection?: Inspection;
  index: number;
  onOpen: () => void;
}) {
  return (
    <Reveal className="location-card" delay={Math.min(index * 0.035, 0.2)}>
      <div className={`location-card-art art-${index % 3}`}>
        <span className="card-road" />
        <span className="card-tree">
          <Trees size={62} strokeWidth={1.1} />
        </span>
        <Store size={94} strokeWidth={1} />
        <Tag>{l.code}</Tag>
        <span className="location-art-note">ILUSTRASI LOKASI</span>
      </div>
      <div className="location-card-body">
        <div className="location-card-meta">
          <span>
            <MapPin size={13} />
            {l.area}
          </span>
          <span>
            {l.open.toString().padStart(2, "0")}.00–{l.close}.00
          </span>
        </div>
        <h3>{l.name}</h3>
        <div className="vendor-count">
          <Users size={15} />
          {l.vendors} pedagang tercatat<span>· 2023</span>
        </div>
        <div className="location-facilities">
          <FacilityRow
            icon={<Umbrella size={16} />}
            label="Peneduh"
            value={inspection?.shade}
          />
          <FacilityRow
            icon={<Droplets size={16} />}
            label="Air minum"
            value={inspection?.water}
          />
          <FacilityRow
            icon={<Armchair size={16} />}
            label="Tempat jeda"
            value={inspection?.rest}
          />
        </div>
        <button className="card-open" onClick={onOpen}>
          Lihat detail lokasi
          <ArrowUpRight size={18} />
        </button>
      </div>
    </Reveal>
  );
}

function HourlyChart({ catalog }: { catalog: Catalog }) {
  return (
    <div className="hourly-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={catalog.hours}
          margin={{ top: 12, right: 12, bottom: 0, left: -22 }}
        >
          <defs>
            <linearGradient id="temperature-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e6a527" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#e6a527" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#dedecd"
          />
          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 23]}
            ticks={[0, 6, 12, 18, 23]}
            tickFormatter={(v) => `${String(v).padStart(2, "0")}.00`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#768065" }}
          />
          <YAxis
            domain={[24, 32]}
            ticks={[24, 26, 28, 30, 32]}
            tickFormatter={(v) => `${v}°`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#768065" }}
          />
          <ReferenceArea x1={11} x2={15} fill="#f2b635" fillOpacity={0.15} />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="chart-tooltip">
                  <strong>
                    {String(payload[0].payload.hour).padStart(2, "0")}.00 WIB
                  </strong>
                  <span>
                    {number(payload[0].value as number, 2)} °C · suhu udara
                  </span>
                </div>
              ) : null
            }
          />
          <ChartArea
            type="monotone"
            dataKey="temperature"
            stroke="#b98624"
            strokeWidth={2.5}
            fill="url(#temperature-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniJakarta({ catalog }: { catalog: Catalog }) {
  const [paths, setPaths] = useState<
    { d: string; category: number; id: string }[]
  >([]);
  useEffect(() => {
    let active = true;
    fetch("/data/jakarta.geojson")
      .then((r) => r.json())
      .then((geo) => {
        const project = (p: number[]) => [
          ((p[0] - 106.68) / 0.32) * 400 + 15,
          ((-p[1] - 6.08) / 0.3) * 365 + 5,
        ];
        const ring = (coords: number[][]) =>
          coords
            .map(
              (p, i) =>
                `${i ? "L" : "M"}${project(p)
                  .map((v) => v.toFixed(1))
                  .join(",")}`,
            )
            .join("") + "Z";
        const next = geo.features.map(
          (f: {
            geometry: { type: string; coordinates: unknown };
            properties: { category: number; id: string };
          }) => {
            const polygons =
              f.geometry.type === "MultiPolygon"
                ? (f.geometry.coordinates as number[][][][])
                : [f.geometry.coordinates as number[][][]];
            return {
              id: f.properties.id,
              category: f.properties.category,
              d: polygons.map((p) => p.map(ring).join("")).join(""),
            };
          },
        );
        if (active) setPaths(next);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <svg
      className="mini-jakarta"
      viewBox="0 0 430 395"
      role="img"
      aria-label={`Peta empat kelompok panas dan vegetasi dari ${catalog.areas.length} kelurahan Jakarta`}
    >
      <defs>
        <pattern
          id="map-dots"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="1" fill="#b8c18c" opacity=".2" />
        </pattern>
      </defs>
      <rect width="430" height="395" fill="url(#map-dots)" />
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill={categoryColors[p.category]}
          stroke="#e1dfbc"
          strokeWidth=".45"
        />
      ))}
      <circle
        cx="312"
        cy="155"
        r="19"
        fill="#f6f4e9"
        stroke="#233300"
        strokeWidth="2"
      />
      <Store x="302" y="145" width="20" height="20" stroke="#4b5d16" />
      <text
        x="313"
        y="190"
        textAnchor="middle"
        fill="#f6f4e9"
        fontSize="10"
        fontWeight="600"
      >
        PULO GADUNG
      </text>
    </svg>
  );
}

function MapLegend({ layer, catalog }: { layer: Layer; catalog: Catalog }) {
  return (
    <div className="map-legend">
      {layer === "priority" ? (
        <>
          <strong>Panas & vegetasi · relatif terhadap median</strong>
          <div className="legend-items">
            {categoryLabels.map((l, i) => (
              <span key={l}>
                <i style={{ background: categoryColors[i] }} />
                {l}
              </span>
            ))}
          </div>
        </>
      ) : layer === "heat" ? (
        <>
          <strong>Median suhu permukaan kelurahan</strong>
          <div className="gradient-legend heat-gradient" />
          <div className="gradient-labels">
            <span>38 °C</span>
            <span>46,5 °C</span>
          </div>
          <small>Komposit Agustus–September 2026 · bukan suhu udara</small>
        </>
      ) : layer === "vegetation" ? (
        <>
          <strong>Indeks vegetasi · NDVI</strong>
          <div className="gradient-legend vegetation-gradient" />
          <div className="gradient-labels">
            <span>0,10 · rendah</span>
            <span>0,47 · tinggi</span>
          </div>
        </>
      ) : layer === "cluster" ? (
        <>
          <strong>K-Means · 4 indikator · k = {catalog.summary.k}</strong>
          <div className="legend-items">
            {[...new Set(catalog.areas.map((area) => area.cluster))]
              .sort((a, b) => a - b)
              .map((cluster) => (
                <span key={cluster}>
                  <i
                    style={{ background: clusterColors[cluster] || "#c5cbaa" }}
                  />
                  Klaster {cluster} ·{" "}
                  {
                    catalog.areas.filter((area) => area.cluster === cluster)
                      .length
                  }{" "}
                  kelurahan
                </span>
              ))}
          </div>
          <small>
            LST, NDVI, log kepadatan WNI, proporsi WNI 65+ · silhouette{" "}
            {number(catalog.summary.silhouette, 3)}
          </small>
        </>
      ) : (
        <>
          <strong>LISA suhu permukaan · Queen · BH-FDR 5%</strong>
          <div className="legend-items">
            {[
              ["High-High", "#c06535"],
              ["Low-Low", "#647d3c"],
              ["High-Low", "#e4b84f"],
              ["Low-High", "#a9b894"],
              ["Tidak signifikan", "#dfdfd1"],
            ].map(([l, c]) => (
              <span key={l}>
                <i style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
          <small>
            {catalog.summary.HH_LISA_setelah_FDR} kelurahan High-High · bukan
            titik ukur lapak
          </small>
        </>
      )}
    </div>
  );
}

function LocationDetails({
  catalog,
  location: l,
  inspection,
  onInspect,
  onReport,
  onMap,
}: {
  catalog: Catalog;
  location: Location;
  inspection?: Inspection;
  onInspect: () => void;
  onReport: () => void;
  onMap: () => void;
}) {
  const area = catalog.areas.find((a) => a.id === l.areaId)!;
  return (
    <>
      <div className="location-detail-info">
        <span>
          <Users size={17} />
          {l.vendors} pedagang · {l.year}
        </span>
        <span>
          <Clock3 size={17} />
          {l.open.toString().padStart(2, "0")}.00–{l.close}.00 WIB
        </span>
      </div>
      <p className="detail-trade">Jenis dagangan: {l.trade}</p>
      <div className="detail-context">
        <Leaf size={19} />
        <div>
          <strong>Konteks kelurahan {l.area}</strong>
          <p>
            Suhu permukaan {number(area.lst, 2)} °C · NDVI{" "}
            {number(area.ndvi, 3)}. Nilai ini bukan hasil pengukuran di lapak.
          </p>
          <button className="text-button" onClick={onMap}>
            Lihat kelurahan di peta
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <h3 className="subheading">Kesiapan fasilitas</h3>
      <div className="detail-facilities">
        <FacilityRow
          icon={<Umbrella size={18} />}
          label="Peneduh"
          value={inspection?.shade}
        />
        <FacilityRow
          icon={<Droplets size={18} />}
          label="Air minum"
          value={inspection?.water}
        />
        <FacilityRow
          icon={<Armchair size={18} />}
          label="Tempat jeda"
          value={inspection?.rest}
        />
      </div>
      {inspection ? (
        <div className="inspection-note">
          <p>{inspection.note || "Tidak ada catatan tambahan."}</p>
          <small>
            Dicatat oleh {inspection.officer} · {dateTime(inspection.createdAt)}
          </small>
          {inspection.photo && (
            <a href={inspection.photo} target="_blank" rel="noreferrer">
              <img
                src={inspection.photo}
                alt="Foto kondisi lapak dari catatan pemeriksaan"
              />
            </a>
          )}
        </div>
      ) : (
        <p className="data-note">
          Belum ada catatan pemeriksaan. Kondisi aktual perlu dikonfirmasi di
          lokasi.
        </p>
      )}
      <div className="dialog-actions">
        <button className="button button-primary" onClick={onInspect}>
          <ClipboardCheck size={17} />
          Catat pemeriksaan
        </button>
        <button className="button button-outline" onClick={onReport}>
          <Flag size={17} />
          Buat laporan
        </button>
      </div>
      <a
        className="source-link"
        href={l.source}
        target="_blank"
        rel="noreferrer"
      >
        Daftar administratif Loksem 2023
        <ExternalLink size={12} />
      </a>
    </>
  );
}

function InspectionForm({
  location,
  previous,
  onSuccess,
  onCancel,
}: {
  location: Location;
  previous?: Inspection;
  onSuccess: (data: Operations) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        const upload = new FormData();
        upload.append("photo", photo);
        const res = await fetch("/api/photos", {
          method: "POST",
          body: upload,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        photoUrl = result.url;
      }
      const payload = {
        type: "inspection",
        locationId: location.id,
        officer: form.get("officer"),
        shade: form.get("shade"),
        water: form.get("water"),
        rest: form.get("rest"),
        note: form.get("note"),
        ...(photoUrl ? { photo: photoUrl } : {}),
      };
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Pemeriksaan gagal disimpan.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="entry-form">
      <p>
        Isi berdasarkan pengamatan di lokasi. Catatan baru akan ditambahkan ke
        riwayat pemeriksaan.
      </p>
      <label>
        Nama pencatat
        <input
          name="officer"
          placeholder="Nama petugas atau pengelola"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
        />
      </label>
      <fieldset disabled={busy}>
        <legend>Kondisi fasilitas saat diperiksa</legend>
        {[
          { name: "shade", label: "Peneduh", icon: <Umbrella size={18} /> },
          { name: "water", label: "Air minum", icon: <Droplets size={18} /> },
          { name: "rest", label: "Tempat jeda", icon: <Armchair size={18} /> },
        ].map((f) => (
          <label className="facility-input" key={f.name}>
            <span>
              {f.icon}
              {f.label}
            </span>
            <select
              name={f.name}
              defaultValue={
                previous?.[f.name as "shade" | "water" | "rest"] ||
                "belum_diperiksa"
              }
            >
              {Object.entries(facilityLabels).map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
      <label>
        Catatan lapangan <span className="optional">opsional</span>
        <textarea
          name="note"
          rows={3}
          maxLength={1200}
          placeholder="Akses fasilitas, kebutuhan perbaikan, atau masukan pedagang…"
        />
      </label>
      <label className="upload-label">
        <span>
          <Plus size={18} />
          {photo ? photo.name : "Tambahkan foto lokasi"}
        </span>
        <small>JPG, PNG, WebP · maksimal 5 MB · opsional</small>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Foto pemeriksaan lokasi"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > 5 * 1024 * 1024) {
              setError("Ukuran foto maksimal 5 MB.");
              e.target.value = "";
              setPhoto(null);
            } else {
              setPhoto(file || null);
              setError("");
            }
          }}
        />
      </label>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="dialog-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Check size={17} />
          )}
          Simpan pemeriksaan
        </button>
        <button
          type="button"
          className="button button-outline"
          onClick={onCancel}
          disabled={busy}
        >
          Batal
        </button>
      </div>
      <p className="data-note">
        Catatan prototipe tersimpan lokal, bukan laporan ke instansi.
      </p>
    </form>
  );
}

function ReportForm({
  locations,
  initialLocation,
  onSuccess,
  onCancel,
}: {
  locations: Location[];
  initialLocation: Location;
  onSuccess: (data: Operations) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "report",
          locationId: form.get("locationId"),
          kind: form.get("kind"),
          note: form.get("note"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laporan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="entry-form">
      <p>
        Laporkan kondisi fasilitas agar dapat diperiksa dan ditindaklanjuti
        pengelola.
      </p>
      <label>
        Lokasi
        <select name="locationId" defaultValue={initialLocation.id}>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} · {l.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fasilitas yang perlu diperhatikan
        <select name="kind">
          <option>Air minum</option>
          <option>Peneduh</option>
          <option>Tempat jeda</option>
          <option>Lainnya</option>
        </select>
      </label>
      <label>
        Ceritakan kondisinya
        <textarea
          name="note"
          required
          minLength={5}
          maxLength={1200}
          rows={4}
          placeholder="Misalnya: air minum di titik teduh sudah habis dan perlu diisi ulang."
        />
      </label>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="dialog-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Flag size={17} />
          )}
          Simpan laporan
        </button>
        <button
          type="button"
          className="button button-outline"
          onClick={onCancel}
          disabled={busy}
        >
          Batal
        </button>
      </div>
      <p className="data-note">
        Laporan tersimpan pada prototipe lokal; belum dikirim ke layanan
        eksternal.
      </p>
    </form>
  );
}

function MessageComposer({ onCopied }: { onCopied: () => void }) {
  const [text, setText] = useState(
    "Pesan operasional TEDUH LAPAK\n\nMari periksa kesiapan peneduh, air minum, dan tempat jeda sebelum jam ramai. Pastikan fasilitas mudah dijangkau dan diskusikan kebutuhan jeda bersama pedagang. Laporkan fasilitas yang perlu diperbaiki kepada pengelola.\n\nPesan pengingat pengelolaan fasilitas, bukan peringatan panas resmi atau informasi cuaca langsung.",
  );
  const [error, setError] = useState("");
  return (
    <div className="entry-form">
      <div className="context-note">
        <Info size={17} />
        <p>
          Belum terhubung dengan layanan peringatan BMKG. Pesan ini adalah
          pengingat operasional yang dapat disalin dan diteruskan secara manual.
        </p>
      </div>
      <label>
        Isi pesan
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          maxLength={3000}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        className="button button-primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            onCopied();
          } catch {
            setError("Salin teks secara manual dari kotak pesan.");
          }
        }}
      >
        <Copy size={16} />
        Salin pesan
      </button>
    </div>
  );
}

function Sources({ catalog }: { catalog: Catalog }) {
  return (
    <div className="sources-content">
      <p>
        Data analisis berasal dari berkas penelitian di folder GELAR RASA.
        Kondisi fasilitas hanya berasal dari catatan yang dimasukkan ke
        prototipe ini.
      </p>
      <div className="source-item">
        <span>01</span>
        <div>
          <h3>Panas permukaan & vegetasi</h3>
          <p>
            Komposit Landsat Agustus–September 2026, sekitar pukul 10.00 WIB.
            Analisis 261 kelurahan dengan minimal 70% cakupan piksel valid. Suhu
            permukaan berbeda dari suhu udara.
          </p>
          <a
            href="https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2"
            target="_blank"
            rel="noreferrer"
          >
            USGS / Microsoft Planetary Computer
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="source-item">
        <span>02</span>
        <div>
          <h3>Empat kelompok deskriptif</h3>
          <p>
            Tinggi/rendah relatif terhadap median LST{" "}
            {number(catalog.thresholds.lst, 3)} °C dan NDVI{" "}
            {number(catalog.thresholds.ndvi, 5)}. Sebanyak 89 kelurahan berada
            pada panas relatif tinggi dan vegetasi relatif rendah. Ini bukan
            hasil algoritme clustering atau klasifikasi bahaya resmi.
          </p>
        </div>
      </div>
      <div className="source-item">
        <span>03</span>
        <div>
          <h3>Clustering & analisis spasial</h3>
          <p>
            K-Means k={catalog.summary.k} memakai LST, NDVI, log kepadatan WNI,
            dan persentase WNI usia 65+ (2025). LISA menggunakan ketetanggaan
            Queen, p dua sisi dan koreksi BH-FDR 5%. Moran I global ={" "}
            {number(catalog.summary.Moran_I_LST, 3)}; p ={" "}
            {number(catalog.summary.p_Moran_LST_2s, 4)}. Struktur penduduk tidak
            menggambarkan usia atau paparan pedagang.
          </p>
          {catalog.summary.dasar_pilihan && (
            <p>{catalog.summary.dasar_pilihan}.</p>
          )}
        </div>
      </div>
      <div className="source-item">
        <span>04</span>
        <div>
          <h3>Jadwal & jumlah pedagang</h3>
          <p>
            Daftar administratif Loksem Pulo Gadung 2023: 10 lokasi, 436
            pedagang tercatat. Jadwal tidak membuktikan kehadiran individu.
            Koordinat lapak belum tersedia; penanda peta mewakili kelurahan.
          </p>
          <a
            href="https://timur.jakarta.go.id/download/230922-073258.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Dokumen Pemkot Jakarta Timur
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="source-item">
        <span>05</span>
        <div>
          <h3>Profil suhu udara</h3>
          <p>
            NASA POWER pada grid sekitar Monas, rata-rata Juli–Oktober 2026.
            Bukan cuaca langsung. Rentang 11.00–15.00 WIB merupakan fokus
            analisis, bukan ambang keselamatan universal.
          </p>
          <a
            href="https://power.larc.nasa.gov/"
            target="_blank"
            rel="noreferrer"
          >
            NASA POWER
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="source-warning">
        <ShieldCheck size={20} />
        <p>
          Fasilitas TEDUH LAPAK merupakan usulan. Korelasi tidak membuktikan
          dampak penanaman pohon. Manfaat intervensi belum diukur dan tidak
          diproyeksikan sebagai penurunan suhu tertentu.
        </p>
      </div>
    </div>
  );
}
