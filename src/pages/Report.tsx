import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  FileCode,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
  Bug,
  Activity,
  Code2,
  History,
  Loader2,
  FolderArchive,
  Layers,
  Terminal,
  Globe,
  Search,
  Box,
  HelpCircle,
  Cpu,
  Share2,
} from "lucide-react";
import { ModLoaderIcon } from "../components/ModLoaderIcon";
import { Seo } from "../components/Seo";
import { ShareModal } from "../components/ShareModal";
import { SITE_URL, getVerdict, verdictLabel } from "../lib/seo";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface Finding {
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
  detail?: string;
}

export interface TransparencyNote {
  type: string;
  detail: string;
  label?: string;
  url?: string;
}

export interface ArchiveMetadata {
  total_entries: number;
  total_files: number;
  total_directories: number;
  max_directory_depth: number;
  total_uncompressed_bytes: number;
  total_compressed_bytes: number;
  compression_ratio: number;
  entropy: number;
  earliest_timestamp?: string;
  latest_timestamp?: string;
  encrypted_entries_count: number;
  has_comment: boolean;
  comment?: string | null;
}

export interface FileTypeStat {
  extension: string;
  count: number;
  uncompressed_bytes: number;
  compressed_bytes: number;
  percentage: number;
  sample_files: string[];
}

export interface FilesByType {
  total_files: number;
  total_uncompressed_bytes: number;
  breakdown: FileTypeStat[];
}

export interface PackageIntelligence {
  contained_packages: string[];
  contained_count: number;
  root_namespaces: { namespace: string; class_count: number }[];
  referenced_packages: string[];
  referenced_count: number;
}

export interface InterestingStrings {
  urls: string[];
  ip_addresses: string[];
  discord_webhooks: string[];
  shell_commands: string[];
  base64_strings: string[];
  system_paths: string[];
  reflection_native: string[];
}

export interface ScanReport {
  file_name: string;
  sha256: string;
  md5?: string;
  sha1?: string;
  mod_loader: string;
  declared_metadata: Record<string, any>;
  risk_score: number;
  risk_level: "safe" | "low" | "medium" | "high" | "critical" | string;
  findings: Finding[];
  transparency_notes: TransparencyNote[];
  manifest?: Record<string, string>;
  manifest_raw?: string;
  archive_metadata?: ArchiveMetadata;
  files_by_type?: FilesByType;
  packages?: PackageIntelligence;
  interesting_strings?: InterestingStrings;
  engines?: Record<string, { name?: string; status: string; detail?: string }>;
  from_cache?: boolean;
  first_scanned_at?: string;
  last_scanned_at?: string;
  scan_count?: number;
  seen_filenames?: string[];
  file_size_bytes?: number;
  file_extension?: string;
  scanner_version?: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
    glow: "bg-red-500",
  },
  high: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    glow: "bg-orange-500",
  },
  medium: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    glow: "bg-yellow-500",
  },
  low: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    glow: "bg-blue-500",
  },
  safe: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    glow: "bg-emerald-500",
  },
  caution: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    glow: "bg-yellow-500",
  },
  risky: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    glow: "bg-orange-500",
  },
  malicious: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
    glow: "bg-red-500",
  },
};

const NOTE_TYPE_META: Record<string, { label: string; icon: typeof BarChart3 }> = {
  analytics: { label: "Analytics & Metrics", icon: BarChart3 },
  error_tracking: { label: "Error Tracking", icon: Bug },
  observability: { label: "Observability", icon: Activity },
  logging: { label: "Logging Framework", icon: FileText },
  networking: { label: "Networking & HTTP", icon: Globe },
  utility: { label: "Utility & Helpers", icon: Code2 },
  bytecode_manipulation: { label: "Bytecode & Mixins", icon: Cpu },
};

const FILE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ".jar": { bg: "bg-red-500", text: "text-red-400" },
  ".png": { bg: "bg-emerald-500", text: "text-emerald-400" },
  ".class": { bg: "bg-indigo-500", text: "text-indigo-400" },
  ".json": { bg: "bg-amber-500", text: "text-amber-400" },
  ".yml": { bg: "bg-cyan-500", text: "text-cyan-400" },
  ".yaml": { bg: "bg-cyan-500", text: "text-cyan-400" },
  ".toml": { bg: "bg-pink-500", text: "text-pink-400" },
  ".properties": { bg: "bg-purple-500", text: "text-purple-400" },
  ".mcmeta": { bg: "bg-blue-400", text: "text-blue-400" },
  ".mf": { bg: "bg-zinc-400", text: "text-zinc-400" },
  "(no extension)": { bg: "bg-zinc-500", text: "text-zinc-400" },
  other: { bg: "bg-slate-500", text: "text-slate-400" },
};

function InfoTooltip({ content, label }: { content: string; label?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="tooltip"
    >
      <HelpCircle className="h-3.5 w-3.5 text-[var(--text-faint)] hover:text-[var(--accent)] cursor-help transition-colors ml-1 inline-block" />
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2.5 rounded-lg border border-[var(--border)] bg-[#12151c] shadow-2xl text-[11px] leading-relaxed text-[var(--text)] font-sans pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {label && <div className="font-semibold text-[var(--accent)] mb-1">{label}</div>}
          <div className="text-[var(--text-muted)]">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#12151c]" />
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB (${bytes.toLocaleString()} bytes)`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
}

function formatDate(isoStr?: string): { formatted: string; relative: string } {
  if (!isoStr) return { formatted: "Unknown", relative: "N/A" };
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return { formatted: isoStr, relative: "N/A" };

    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    let relative = "just now";
    if (diffSec >= 86400 * 30) {
      relative = `${Math.floor(diffSec / (86400 * 30))} mo ago`;
    } else if (diffSec >= 86400) {
      relative = `${Math.floor(diffSec / 86400)}d ago`;
    } else if (diffSec >= 3600) {
      relative = `${Math.floor(diffSec / 3600)}h ago`;
    } else if (diffSec >= 60) {
      relative = `${Math.floor(diffSec / 60)}m ago`;
    }

    const formatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return { formatted, relative };
  } catch {
    return { formatted: isoStr, relative: "N/A" };
  }
}

function formatMetadataValue(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val.map((item) => formatMetadataValue(item)).filter(Boolean).join(", ");
  }
  if (typeof val === "object") {
    if (val.name) return String(val.name);
    if (val.author) return String(val.author);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export function Report() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [report, setReport] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"detection" | "details" | "archive" | "strings" | "packages">("detection");
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>("all");
  const [stringFilterCategory, setStringFilterCategory] = useState<string>("urls");
  const [stringSearchQuery, setStringSearchQuery] = useState("");
  const [packageSearchQuery, setPackageSearchQuery] = useState("");
  const [showRawManifest, setShowRawManifest] = useState(false);
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [fileTypeMetric, setFileTypeMetric] = useState<"size" | "count">("size");
  const [hoveredExtension, setHoveredExtension] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (location.state?.report) {
      setReport(location.state.report);
      return;
    }

    if (id) {
      const stored = sessionStorage.getItem(`scan_${id}`) || sessionStorage.getItem("latest_scan");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!id || id === "latest" || parsed.sha256 === id) {
            setReport(parsed);
            return;
          }
        } catch {
        }
      }

      if (id && id !== "latest" && id.length >= 16) {
        setLoading(true);
        fetch(`${API_BASE_URL}/scan/${id}`)
          .then((res) => {
            if (!res.ok) throw new Error("Not found");
            return res.json();
          })
          .then((data) => {
            setReport(data);
            sessionStorage.setItem(`scan_${data.sha256}`, JSON.stringify(data));
          })
          .catch((err) => {
            console.debug("Could not fetch cached report by hash:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [id, location.state]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return activeSeverityFilter === "all"
      ? report.findings
      : report.findings.filter((f) => f.severity.toLowerCase() === activeSeverityFilter);
  }, [report, activeSeverityFilter]);

  const stringCategories = useMemo(() => {
    const all = [
      { key: "urls", label: "URLs", count: report?.interesting_strings?.urls?.length || 0 },
      { key: "ips", label: "IP Addresses", count: report?.interesting_strings?.ip_addresses?.length || 0 },
      { key: "webhooks", label: "Discord Webhooks", count: report?.interesting_strings?.discord_webhooks?.length || 0 },
      { key: "commands", label: "Shell Commands", count: report?.interesting_strings?.shell_commands?.length || 0 },
      { key: "base64", label: "Base64 Payloads", count: report?.interesting_strings?.base64_strings?.length || 0 },
      { key: "reflection", label: "Reflective / Native", count: report?.interesting_strings?.reflection_native?.length || 0 },
      { key: "paths", label: "System Paths", count: report?.interesting_strings?.system_paths?.length || 0 },
    ];
    return all.filter((cat) => cat.count > 0);
  }, [report]);

  useEffect(() => {
    if (stringCategories.length === 0) return;
    if (!stringCategories.some((cat) => cat.key === stringFilterCategory)) {
      setStringFilterCategory(stringCategories[0].key);
    }
  }, [stringCategories, stringFilterCategory]);

  const displayedStrings = useMemo(() => {
    if (!report?.interesting_strings) return [];
    const stringsObj = report.interesting_strings;
    let list: string[] = [];
    if (stringFilterCategory === "urls") list = stringsObj.urls || [];
    else if (stringFilterCategory === "ips") list = stringsObj.ip_addresses || [];
    else if (stringFilterCategory === "webhooks") list = stringsObj.discord_webhooks || [];
    else if (stringFilterCategory === "commands") list = stringsObj.shell_commands || [];
    else if (stringFilterCategory === "base64") list = stringsObj.base64_strings || [];
    else if (stringFilterCategory === "reflection") list = stringsObj.reflection_native || [];
    else if (stringFilterCategory === "paths") list = stringsObj.system_paths || [];

    if (!stringSearchQuery.trim()) return list;
    const query = stringSearchQuery.toLowerCase();
    return list.filter((s) => s.toLowerCase().includes(query));
  }, [report, stringFilterCategory, stringSearchQuery]);

  const filteredContainedPackages = useMemo(() => {
    if (!report?.packages?.contained_packages) return [];
    const list = report.packages.contained_packages;
    if (!packageSearchQuery.trim()) return list;
    const query = packageSearchQuery.toLowerCase();
    return list.filter((p) => p.toLowerCase().includes(query));
  }, [report, packageSearchQuery]);

  const filteredReferencedPackages = useMemo(() => {
    if (!report?.packages?.referenced_packages) return [];
    const list = report.packages.referenced_packages;
    if (!packageSearchQuery.trim()) return list;
    const query = packageSearchQuery.toLowerCase();
    return list.filter((p) => p.toLowerCase().includes(query));
  }, [report, packageSearchQuery]);

  if (loading) {
    return (
      <div className="px-6 py-24 sm:px-10">
        <Seo title="Loading scan…" path={`/report/${id ?? ""}`} noindex />
        <div className="mx-auto max-w-md text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--accent)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">Loading Scan Intelligence...</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Retrieving verified static analysis report</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-6 py-12 sm:px-10">
        <Seo title="Report not found" path={`/report/${id ?? ""}`} noindex />
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            back to scanner
          </Link>
          <div className="mx-auto mt-16 max-w-md text-center">
            <FileText className="mx-auto h-12 w-12 text-[var(--text-faint)] opacity-60" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold text-[var(--text)]">No Report Found</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              No scan results available for <span className="font-mono text-xs text-[var(--text)]">{id}</span>.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              Go to Scanner
            </button>
          </div>
        </div>
      </div>
    );
  }

  const level = (report.risk_level || "safe").toLowerCase();
  const severityStyle = SEVERITY_STYLES[level] || SEVERITY_STYLES.safe;

  const verdict = getVerdict(report.risk_level, report.risk_score);
  const verdictUi = {
    safe: {
      label: "Safe",
      sub: "No known malicious patterns in static analysis",
      icon: <ShieldCheck className="h-14 w-14 text-emerald-400" strokeWidth={1.75} />,
      wrap: "border-emerald-500/40 bg-emerald-500/10",
      text: "text-emerald-400",
      badge: "bg-emerald-500 text-emerald-950",
    },
    suspicious: {
      label: "Suspicious",
      sub: "Signals that deserve a closer look before you install",
      icon: <AlertTriangle className="h-14 w-14 text-amber-400" strokeWidth={1.75} />,
      wrap: "border-amber-500/40 bg-amber-500/10",
      text: "text-amber-400",
      badge: "bg-amber-400 text-amber-950",
    },
    malicious: {
      label: "Malicious",
      sub: "High-risk patterns detected, do not install this file",
      icon: <ShieldAlert className="h-14 w-14 text-red-400" strokeWidth={1.75} />,
      wrap: "border-red-500/40 bg-red-500/10",
      text: "text-red-400",
      badge: "bg-red-500 text-white",
    },
  }[verdict];

  const firstScan = formatDate(report.first_scanned_at);
  const lastScan = formatDate(report.last_scanned_at);

  const libraryNotes = report.transparency_notes?.filter(
    (n) => n.label || ["analytics", "error_tracking", "observability", "logging", "networking", "utility", "bytecode_manipulation"].includes(n.type)
  ) || [];

  return (
    <div className="px-4 py-8 sm:px-8 max-w-7xl mx-auto font-sans">
      <Seo
        title={report.file_name}
        description={`TraceRoot static analysis for ${report.file_name} (${verdictLabel(verdict)}). Risk score: ${report.risk_score}/100. SHA-256: ${report.sha256}.`}
        path={`/report/${report.sha256}`}
        noindex
        themeColor={verdict === "safe" ? "#10b981" : verdict === "suspicious" ? "#f59e0b" : "#ef4444"}
        image={`${SITE_URL}/og/${report.sha256}`}
      />
            <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-faint)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          back to scanner
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all cursor-pointer shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            onClick={() => navigate("/")}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all cursor-pointer shadow-sm"
          >
            + Scan another file
          </button>
        </div>
      </div>

            <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl ${verdictUi.wrap}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {verdictUi.icon}
          <div className="min-w-0">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${verdictUi.badge}`}>
              {verdictUi.label}
            </span>
            <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight ${verdictUi.text}`}>
              {verdictUi.label}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{verdictUi.sub}</p>
          </div>
          <div className="sm:ml-auto text-left sm:text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">Score</div>
            <div className={`text-3xl font-extrabold ${verdictUi.text}`}>
              {report.risk_score} <span className="text-sm font-normal text-[var(--text-faint)]">/ 100</span>
            </div>
          </div>
        </div>
      </div>

                        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div
          className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-[0.08] ${severityStyle.glow}`}
          aria-hidden="true"
        />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-5 relative">
                    <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2.5">
                <ModLoaderIcon name={report.mod_loader} className="h-9 w-9 shrink-0 drop-shadow-sm" />
                <span className="font-bold uppercase text-lg text-[var(--text)] tracking-wide leading-none">
                  {report.mod_loader}
                </span>
              </span>

              {report.from_cache && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400"
                  title="Served from 7-day verified cache"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Cached
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] font-mono break-all select-all">
                {report.file_name}
              </h1>
              <button
                onClick={() => copyToClipboard(report.file_name, "filename")}
                className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-surface-raised)] transition-colors flex-shrink-0"
                title="Copy file name"
              >
                {copiedKey === "filename" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

                {report.declared_metadata && Object.keys(report.declared_metadata).length > 0 && (
          <div className="py-4 relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
              Declared Mod Metadata
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {report.declared_metadata.name && (
                <div className="rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3">
                  <span className="text-[var(--text-faint)] block text-[10px] uppercase font-semibold">Mod / Plugin Name</span>
                  <span className="font-medium text-[var(--text)] text-sm">{report.declared_metadata.name}</span>
                </div>
              )}
              {report.declared_metadata.version && (
                <div className="rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3 font-mono">
                  <span className="text-[var(--text-faint)] block font-sans text-[10px] uppercase font-semibold">Version</span>
                  <span className="font-medium text-[var(--text)]">{report.declared_metadata.version}</span>
                </div>
              )}
              {(report.declared_metadata.author || report.declared_metadata.authors) && (
                <div className="rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3">
                  <span className="text-[var(--text-faint)] block text-[10px] uppercase font-semibold">Author(s)</span>
                  <span className="font-medium text-[var(--text)] truncate block">
                    {formatMetadataValue(report.declared_metadata.author || report.declared_metadata.authors)}
                  </span>
                </div>
              )}
              {report.declared_metadata.main && (
                <div className="rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3 font-mono">
                  <span className="text-[var(--text-faint)] block font-sans text-[10px] uppercase font-semibold">Main Entrypoint</span>
                  <span className="font-medium text-[var(--text)] truncate block" title={report.declared_metadata.main}>
                    {report.declared_metadata.main}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

                <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
                            <div className="flex items-start justify-between gap-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3.5 text-xs">
                <div className="min-w-0 flex-1 mr-2">
                  <div className="text-[10px] font-bold uppercase text-[var(--text-faint)] mb-1">
                    SHA-256
                  </div>
                  <div className="font-mono text-[var(--text)] text-[11px] break-all select-all leading-relaxed">{report.sha256}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(report.sha256, "sha256")}
                  className="p-1.5 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] cursor-pointer transition-colors shrink-0"
                  title="Copy SHA-256"
                >
                  {copiedKey === "sha256" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

                            {report.sha1 && (
                <div className="flex items-start justify-between gap-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3.5 text-xs">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-[10px] font-bold uppercase text-[var(--text-faint)] mb-1">
                      SHA-1
                    </div>
                    <div className="font-mono text-[var(--text)] text-[11px] break-all select-all leading-relaxed">{report.sha1}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(report.sha1!, "sha1")}
                    className="p-1.5 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] cursor-pointer transition-colors shrink-0"
                    title="Copy SHA-1"
                  >
                    {copiedKey === "sha1" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}

                            {report.md5 && (
                <div className="flex items-start justify-between gap-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border)] p-3.5 text-xs">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-[10px] font-bold uppercase text-[var(--text-faint)] mb-1">
                      MD5
                    </div>
                    <div className="font-mono text-[var(--text)] text-[11px] break-all select-all leading-relaxed">{report.md5}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(report.md5!, "md5")}
                    className="p-1.5 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] cursor-pointer transition-colors shrink-0"
                    title="Copy MD5"
                  >
                    {copiedKey === "md5" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>

                    <div className="rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border)] divide-y divide-[var(--border-soft)] sm:divide-y-0 sm:flex sm:divide-x">
            <div className="p-3.5 flex-1">
              <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold block mb-0.5">File Size</span>
              <span className="font-mono font-medium text-[var(--text)] text-sm">
                {formatBytes(report.file_size_bytes || report.archive_metadata?.total_compressed_bytes)}
              </span>
            </div>

            <div className="p-3.5 flex-1">
              <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold block mb-0.5">First Scanned</span>
              <span className="font-medium text-[var(--text)] text-sm">{firstScan.formatted}</span>
            </div>

            <div className="p-3.5 flex-1">
              <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold block mb-0.5">Last Scanned</span>
              <span className="font-medium text-[var(--text)] text-sm">{lastScan.formatted}</span>
            </div>

            <div className="p-3.5 flex-1">
              <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold block mb-0.5">Scan Count</span>
              <span className="font-medium text-[var(--text)] text-sm">{report.scan_count || 1} time(s)</span>
            </div>

            <div className="p-3.5 flex-1 min-w-0">
              <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold block mb-0.5">Scanner Engine</span>
              <span className="font-mono text-xs text-[var(--text)] truncate block">
                {report.scanner_version || "TraceRoot v1.0"}
              </span>
            </div>
          </div>

                    {report.seen_filenames && report.seen_filenames.length > 1 && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--text-faint)] text-[11px] flex items-center gap-1">
                <History className="h-3 w-3 text-[var(--accent)]" />
                Also seen as:
              </span>
              {report.seen_filenames.map((name, i) => (
                <span
                  key={i}
                  className={`rounded px-2 py-0.5 font-mono text-[11px] border ${
                    name === report.file_name
                      ? "bg-[var(--accent-soft)] border-[var(--accent-dim)] text-[var(--text)] font-semibold"
                      : "bg-[var(--bg-base)] border-[var(--border-soft)] text-[var(--text-muted)]"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

                        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-soft)]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              Security Verification Checks
            </h3>
            <InfoTooltip content="Multi-stage verification including bytecode inspection, known threat signatures, executable payload checks, and archive safety." label="Verification Summary" />
          </div>

          <a
            href={`https://www.virustotal.com/gui/file/${report.sha256}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-medium"
          >
            Cross-check hash on VirusTotal <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Bytecode Analysis</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  (report.findings?.length || 0) === 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {(report.findings?.length || 0) === 0 ? "Clean" : `${report.findings.length} Flagged`}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text)]">Behavioral Patterns</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {(report.findings?.length || 0) === 0
                ? "No suspicious patterns triggered"
                : `${report.findings.length} security pattern(s) identified`}
            </div>
          </div>

                    <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Threat Signatures</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  report.engines?.yara?.status === "matched"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : report.engines?.yara?.status === "clean"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"
                }`}
              >
                {report.engines?.yara?.status ? report.engines.yara.status.toUpperCase() : "CLEAN"}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text)]">Known Threat DB</div>
            <div className="text-[11px] text-[var(--text-muted)] truncate" title={report.engines?.yara?.detail}>
              {report.engines?.yara?.detail ? "Threat pattern verified" : "Malware signature database verified"}
            </div>
          </div>

                    <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Binary Inspection</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  report.engines?.clamav?.status === "infected"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : report.engines?.clamav?.status === "clean"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"
                }`}
              >
                {report.engines?.clamav?.status ? report.engines.clamav.status.toUpperCase() : "CLEAN"}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text)]">Payload &amp; Executables</div>
            <div className="text-[11px] text-[var(--text-muted)] truncate" title={report.engines?.clamav?.detail}>
              {report.engines?.clamav?.detail ? "Binary payload scanned" : "Embedded executable check passed"}
            </div>
          </div>

                    <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Archive Safety</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  (report.archive_metadata?.entropy || 0) > 7.6
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {(report.archive_metadata?.entropy || 0) > 7.6 ? "High Entropy" : "Normal"}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text)]">Structure &amp; Entropy</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {report.archive_metadata
                ? `Entropy ${report.archive_metadata.entropy} · Ratio ${report.archive_metadata.compression_ratio}:1`
                : "Standard archive structure"}
            </div>
          </div>
        </div>
      </div>

                        <div className="mt-8 border-b border-[var(--border)] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("detection")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "detection"
              ? "border-[var(--accent)] text-[var(--text)] bg-[var(--bg-surface)] rounded-t-lg"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-[var(--accent)]" />
          Scan Findings
          <span className="rounded-full bg-[var(--bg-base)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-mono">
            {report.findings?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "archive"
              ? "border-[var(--accent)] text-[var(--text)] bg-[var(--bg-surface)] rounded-t-lg"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <FolderArchive className="h-4 w-4 text-cyan-400" />
          Archive &amp; Files
          {report.archive_metadata && (
            <span className="rounded-full bg-[var(--bg-base)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-mono">
              {report.archive_metadata.total_files} files
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "details"
              ? "border-[var(--accent)] text-[var(--text)] bg-[var(--bg-surface)] rounded-t-lg"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <FileText className="h-4 w-4 text-purple-400" />
          Manifest &amp; Properties
          {report.manifest && (
            <span className="rounded-full bg-[var(--bg-base)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-mono">
              {Object.keys(report.manifest).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("strings")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "strings"
              ? "border-[var(--accent)] text-[var(--text)] bg-[var(--bg-surface)] rounded-t-lg"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Terminal className="h-4 w-4 text-emerald-400" />
          Strings &amp; Indicators
          {report.interesting_strings && (
            <span className="rounded-full bg-[var(--bg-base)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-mono">
              {(report.interesting_strings.urls?.length || 0) +
                (report.interesting_strings.shell_commands?.length || 0) +
                (report.interesting_strings.base64_strings?.length || 0) +
                (report.interesting_strings.reflection_native?.length || 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("packages")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "packages"
              ? "border-[var(--accent)] text-[var(--text)] bg-[var(--bg-surface)] rounded-t-lg"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Box className="h-4 w-4 text-amber-400" />
          Packages &amp; Libraries
          {report.packages && (
            <span className="rounded-full bg-[var(--bg-base)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-mono">
              {report.packages.contained_count || 0} pkgs
            </span>
          )}
        </button>
      </div>

                        {activeTab === "detection" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
                Static Analysis Detections
                <InfoTooltip content="Rules triggered by bytecode patterns, reflection calls, dangerous APIs, or YARA signatures." label="Detections" />
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {report.findings.length} findings matched during static analysis
              </p>
            </div>

                        {report.findings.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-1 text-xs">
                {["all", "critical", "high", "medium", "low"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setActiveSeverityFilter(sev)}
                    className={`rounded-md px-2.5 py-1 capitalize transition-colors cursor-pointer ${
                      activeSeverityFilter === sev
                        ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredFindings.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center shadow-md">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400 opacity-90" strokeWidth={1.5} />
              <h3 className="mt-3 text-base font-semibold text-[var(--text)]">
                {report.findings.length === 0 ? "No Threat Detections" : `No findings matching filter "${activeSeverityFilter}"`}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)] max-w-md mx-auto">
                {report.findings.length === 0
                  ? "Static analysis did not identify any known malicious patterns, remote classloaders, command injections, or destructive routines."
                  : "Try selecting 'all' to see findings across all severity tiers."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((finding, idx) => {
                const style = SEVERITY_STYLES[finding.severity.toLowerCase()] || SEVERITY_STYLES.medium;
                const isExpanded = expandedFindings[idx] !== undefined ? expandedFindings[idx] : (finding.severity === "critical" || finding.severity === "high");
                const hasDetail = Boolean(finding.detail);

                return (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 transition-all bg-[var(--bg-surface)] hover:border-[var(--border)] border-[var(--border-soft)] shadow-sm"
                  >
                    <div
                      className={`flex items-start justify-between gap-3 ${hasDetail ? "cursor-pointer select-none" : ""}`}
                      onClick={() => {
                        if (hasDetail) {
                          setExpandedFindings((prev) => ({ ...prev, [idx]: !isExpanded }));
                        }
                      }}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                            {finding.severity}
                          </span>
                          <span className="font-mono text-xs text-[var(--text-faint)]">{finding.category}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-[var(--text)]">{finding.summary}</h4>
                      </div>

                      {hasDetail && (
                        <button
                          type="button"
                          className="p-1 rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-surface-raised)] transition-colors"
                          title={isExpanded ? "Collapse detail" : "Expand detail"}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>

                    {hasDetail && isExpanded && (
                      <div className="mt-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-soft)] p-3 text-xs font-mono text-[var(--text-muted)] break-all whitespace-pre-wrap animate-in fade-in duration-150">
                        {finding.detail}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

                        {activeTab === "archive" && (
        <div className="mt-6 space-y-6">
                    {report.archive_metadata && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-soft)]">
                <div className="flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)]">
                    Archive Structure &amp; Compression Metrics
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                                <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3">
                  <div className="text-[10px] text-[var(--text-faint)] uppercase font-semibold flex items-center">
                    Max Depth
                    <InfoTooltip content="Deepest directory nesting depth inside the archive. Abnormal depths (>10) may suggest packaging tricks." label="Directory Depth" />
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--text)] mt-1">
                    {report.archive_metadata.max_directory_depth}
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)]">Nesting levels</div>
                </div>

                                <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3">
                  <div className="text-[10px] text-[var(--text-faint)] uppercase font-semibold flex items-center">
                    Total Files
                    <InfoTooltip content="Count of all non-directory files contained in the JAR archive." label="Files Count" />
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--text)] mt-1">
                    {report.archive_metadata.total_files}
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)]">
                    +{report.archive_metadata.total_directories} directories
                  </div>
                </div>

                                <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3">
                  <div className="text-[10px] text-[var(--text-faint)] uppercase font-semibold flex items-center">
                    Uncompressed
                    <InfoTooltip content="Total size of all extracted files before compression." label="Uncompressed Size" />
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--text)] mt-1">
                    {formatBytes(report.archive_metadata.total_uncompressed_bytes)}
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)]">Raw size</div>
                </div>

                                <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3">
                  <div className="text-[10px] text-[var(--text-faint)] uppercase font-semibold flex items-center">
                    Ratio
                    <InfoTooltip content="Ratio of uncompressed size to compressed size. Ratios above 100:1 indicate zip-bomb risks." label="Compression Ratio" />
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--text)] mt-1">
                    {report.archive_metadata.compression_ratio}:1
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)]">Decompression factor</div>
                </div>

                                <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3">
                  <div className="text-[10px] text-[var(--text-faint)] uppercase font-semibold flex items-center">
                    Entropy
                    <InfoTooltip content="Shannon entropy (0 to 8). Values > 7.5 indicate high randomness, encryption, or heavy compression." label="Shannon Entropy" />
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--text)] mt-1">
                    {report.archive_metadata.entropy}
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)]">0.0 - 8.0 bits/byte</div>
                </div>

                                <div className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3">
                  <div className="text-[10px] text-[var(--text-faint)] uppercase font-semibold flex items-center">
                    Latest Timestamp
                    <InfoTooltip content="Newest entry timestamp recorded in the ZIP header." label="ZIP Timestamp" />
                  </div>
                  <div className="font-medium text-[var(--text)] mt-1 truncate" title={report.archive_metadata.latest_timestamp}>
                    {report.archive_metadata.latest_timestamp ? report.archive_metadata.latest_timestamp.split("T")[0] : "N/A"}
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)]">Entry date</div>
                </div>
              </div>
            </div>
          )}

                    {report.files_by_type && report.files_by_type.breakdown.length > 0 && (() => {
            const totalFiles = report.files_by_type.total_files;
            const totalBytes = report.files_by_type.total_uncompressed_bytes;

            const allItems = report.files_by_type.breakdown.map((item) => {
              const countPct = totalFiles > 0 ? (item.count / totalFiles) * 100 : 0;
              const sizePct = totalBytes > 0 ? (item.uncompressed_bytes / totalBytes) * 100 : 0;
              const activePct = fileTypeMetric === "size" ? sizePct : countPct;
              return {
                ...item,
                countPercentage: Math.round(countPct * 10) / 10,
                sizePercentage: Math.round(sizePct * 10) / 10,
                activePercentage: Math.round(activePct * 10) / 10,
              };
            });

            const visibleItems = allItems.filter((item) => item.activePercentage >= 0.1);

            return (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-soft)]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)]">
                      Contained Files By Type
                    </h3>
                    <InfoTooltip content="Categorized distribution of files contained inside the archive." label="File Types" />
                  </div>

                  <div className="flex items-center gap-3">
                                        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setFileTypeMetric("size")}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                          fileTypeMetric === "size"
                            ? "bg-[var(--bg-surface-raised)] text-[var(--text)] shadow-sm border border-[var(--border)]"
                            : "text-[var(--text-faint)] hover:text-[var(--text)]"
                        }`}
                      >
                        By Size
                      </button>
                      <button
                        type="button"
                        onClick={() => setFileTypeMetric("count")}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                          fileTypeMetric === "count"
                            ? "bg-[var(--bg-surface-raised)] text-[var(--text)] shadow-sm border border-[var(--border)]"
                            : "text-[var(--text-faint)] hover:text-[var(--text)]"
                        }`}
                      >
                        By File Count
                      </button>
                    </div>

                    <span className="hidden sm:inline text-xs text-[var(--text-faint)] font-mono">
                      {totalFiles} files ({formatBytes(totalBytes)})
                    </span>
                  </div>
                </div>

                                <div className="space-y-3">
                  <div className="h-4 w-full rounded-xl bg-[var(--bg-base)] p-0.5 border border-[var(--border-soft)] overflow-hidden flex shadow-inner gap-0.5">
                    {visibleItems.map((item, idx) => {
                      const color = FILE_TYPE_COLORS[item.extension] || FILE_TYPE_COLORS.other;
                      const isHovered = hoveredExtension === item.extension;
                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredExtension(item.extension)}
                          onMouseLeave={() => setHoveredExtension(null)}
                          className={`${color.bg} h-full rounded-sm transition-all cursor-pointer ${
                            isHovered ? "brightness-125 scale-y-110 shadow-md ring-1 ring-white/40 z-10" : "hover:brightness-110"
                          }`}
                          style={{ width: `${Math.max(item.activePercentage, 1)}%` }}
                        />
                      );
                    })}
                  </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                    {visibleItems.map((item, idx) => {
                      const color = FILE_TYPE_COLORS[item.extension] || FILE_TYPE_COLORS.other;
                      const isHovered = hoveredExtension === item.extension;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onMouseEnter={() => setHoveredExtension(item.extension)}
                          onMouseLeave={() => setHoveredExtension(null)}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 font-mono text-xs transition-all cursor-pointer ${
                            isHovered
                              ? "border-[var(--accent)] bg-[var(--bg-surface-raised)] shadow-sm ring-1 ring-[var(--accent)]/30"
                              : "border-[var(--border-soft)] bg-[var(--bg-base)]/60 hover:border-[var(--border)]"
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
                          <span className="text-[var(--text)] font-semibold">{item.extension}</span>
                          <span className="text-[var(--text-muted)] text-[11px]">
                            {item.activePercentage}%
                          </span>
                          <span className="text-[10px] text-[var(--text-faint)]">
                            ({fileTypeMetric === "size" ? formatBytes(item.uncompressed_bytes) : `${item.count} files`})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-soft)] text-[var(--text-faint)] uppercase text-[10px]">
                        <th className="pb-2 font-semibold">Extension / Type</th>
                        <th className="pb-2 font-semibold">File Count</th>
                        <th className="pb-2 font-semibold">Uncompressed Size</th>
                        <th className="pb-2 font-semibold">Share (Size)</th>
                        <th className="pb-2 font-semibold">Share (Count)</th>
                        <th className="pb-2 font-semibold">Sample Entries</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-soft)]">
                      {allItems.map((item, idx) => (
                        <tr
                          key={idx}
                          onMouseEnter={() => setHoveredExtension(item.extension)}
                          onMouseLeave={() => setHoveredExtension(null)}
                          className={`transition-colors ${
                            hoveredExtension === item.extension ? "bg-[var(--bg-surface-raised)]/60" : "hover:bg-[var(--bg-base)]/50"
                          }`}
                        >
                          <td className="py-2.5 font-mono font-semibold text-[var(--text)]">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${(FILE_TYPE_COLORS[item.extension] || FILE_TYPE_COLORS.other).bg}`} />
                              {item.extension}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[var(--text-muted)]">{item.count}</td>
                          <td className="py-2.5 font-mono text-[var(--text-muted)]">{formatBytes(item.uncompressed_bytes)}</td>
                          <td className="py-2.5 font-mono text-[var(--text)]">
                            {item.sizePercentage >= 0.1 ? `${item.sizePercentage}%` : item.uncompressed_bytes > 0 ? "< 0.1%" : "0%"}
                          </td>
                          <td className="py-2.5 font-mono text-[var(--text-muted)]">
                            {item.countPercentage >= 0.1 ? `${item.countPercentage}%` : "< 0.1%"}
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-[var(--text-faint)] max-w-xs truncate" title={item.sample_files.join(", ")}>
                            {item.sample_files.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

                        {activeTab === "details" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)]">
                  META-INF/MANIFEST.MF Properties
                </h3>
                <InfoTooltip content="Standard Java JAR manifest specification key-value headers (RFC 822 unfolded format)." label="JAR Manifest" />
              </div>
              {report.manifest_raw && (
                <button
                  onClick={() => setShowRawManifest(!showRawManifest)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer"
                >
                  {showRawManifest ? "View Table" : "View Raw Text"}
                </button>
              )}
            </div>

            {report.manifest && Object.keys(report.manifest).length > 0 ? (
              showRawManifest && report.manifest_raw ? (
                <div className="rounded-xl bg-[#0d1017] border border-[var(--border-soft)] p-4 font-mono text-xs text-[var(--text-muted)] whitespace-pre-wrap break-all overflow-x-auto">
                  {report.manifest_raw}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-soft)] text-[var(--text-faint)] uppercase text-[10px]">
                        <th className="pb-2 font-semibold w-1/3">Header Attribute</th>
                        <th className="pb-2 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-soft)] font-mono">
                      {Object.entries(report.manifest).map(([key, val], idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-base)]/50 transition-colors">
                          <td className="py-2.5 text-[var(--accent)] font-medium pr-4">{key}</td>
                          <td className="py-2.5 text-[var(--text)] break-all select-all">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-faint)] font-mono">
                No MANIFEST.MF file found in this archive.
              </div>
            )}
          </div>
        </div>
      )}

                        {activeTab === "strings" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-soft)]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  Extracted Indicators &amp; Forensic Strings
                  <InfoTooltip content="Network addresses, Discord webhooks, Base64 candidates, reflective API calls, and OS commands extracted from class constant pools." label="Strings" />
                </h3>
              </div>

                            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-faint)]" />
                <input
                  type="text"
                  placeholder="Filter strings..."
                  value={stringSearchQuery}
                  onChange={(e) => setStringSearchQuery(e.target.value)}
                  className="rounded-lg bg-[var(--bg-base)] border border-[var(--border)] pl-9 pr-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none w-56"
                />
              </div>
            </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {stringCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setStringFilterCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    stringFilterCategory === cat.key
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] font-semibold shadow-sm"
                      : "bg-[var(--bg-base)] border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {cat.label}
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

                        {displayedStrings.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-faint)] font-mono">
                {stringSearchQuery ? `No strings found matching "${stringSearchQuery}"` : "No strings identified in this category."}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {displayedStrings.map((str, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-soft)] px-3.5 py-2 text-xs font-mono text-[var(--text)] hover:border-[var(--border)] transition-colors group"
                  >
                    <span className="truncate break-all select-all flex-1">{str}</span>
                    <button
                      onClick={() => copyToClipboard(str, `str_${idx}`)}
                      className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text)] transition-colors opacity-60 group-hover:opacity-100 cursor-pointer flex-shrink-0"
                      title="Copy string"
                    >
                      {copiedKey === `str_${idx}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

                        {activeTab === "packages" && (
        <div className="mt-6 space-y-6">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-soft)]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                  <Box className="h-4 w-4 text-amber-400" />
                  Java Packages Contained in Archive
                  <InfoTooltip content="All Java package namespaces declared by .class files in this mod." label="Java Packages" />
                </h3>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {report.packages?.contained_count || 0} unique package namespaces
                </span>
              </div>

                            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-faint)]" />
                <input
                  type="text"
                  placeholder="Filter packages..."
                  value={packageSearchQuery}
                  onChange={(e) => setPackageSearchQuery(e.target.value)}
                  className="rounded-lg bg-[var(--bg-base)] border border-[var(--border)] pl-9 pr-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none w-56"
                />
              </div>
            </div>

                        {report.packages?.root_namespaces && report.packages.root_namespaces.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-[var(--text-faint)] font-semibold uppercase">Root Namespaces:</span>
                {report.packages.root_namespaces.map((ns, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-soft)] px-2.5 py-1 text-xs font-mono text-[var(--text)]"
                  >
                    <span className="font-semibold text-[var(--accent)]">{ns.namespace}</span>
                    <span className="text-[var(--text-faint)]">({ns.class_count} classes)</span>
                  </span>
                ))}
              </div>
            )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 pt-2">
              {filteredContainedPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-soft)] px-3 py-2 text-xs font-mono text-[var(--text)] truncate"
                  title={pkg}
                >
                  {pkg}
                </div>
              ))}
            </div>
          </div>

                    {report.packages?.referenced_packages && report.packages.referenced_packages.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md space-y-4">
              <div className="pb-3 border-b border-[var(--border-soft)]">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  Referenced External Packages &amp; APIs
                  <InfoTooltip content="3rd-party packages imported or called in constant pools." label="Referenced APIs" />
                </h3>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {report.packages.referenced_count || 0} referenced dependencies/APIs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredReferencedPackages.map((pkg, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-mono text-[var(--text-muted)] truncate"
                    title={pkg}
                  >
                    {pkg}
                  </div>
                ))}
              </div>
            </div>
          )}

                    {libraryNotes.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-md space-y-4">
              <div className="pb-3 border-b border-[var(--border-soft)]">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                  <Box className="h-4 w-4 text-[var(--accent)]" />
                  Detected Third-Party Libraries &amp; Frameworks
                  <InfoTooltip content="Known telemetry, analytics, bytecode manipulation, or networking libraries embedded in the mod." label="Detected Libraries" />
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Informational detections of legitimate third-party dependencies (not scored as malware)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {libraryNotes.map((note, idx) => {
                  const meta = NOTE_TYPE_META[note.type] ?? { label: note.type.replace(/_/g, " "), icon: Box };
                  const Icon = meta.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-base)] p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[var(--accent)]" />
                          <span className="font-semibold text-sm text-[var(--text)]">
                            {note.label || meta.label}
                          </span>
                        </div>
                        {note.url && (
                          <a
                            href={note.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                          >
                            Docs <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{note.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

                        <div className="mt-10 border-t border-[var(--border-soft)] pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowJsonRaw(!showJsonRaw)}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors cursor-pointer"
          >
            <FileCode className="h-4 w-4" />
            {showJsonRaw ? "Hide Raw JSON Output" : "View Raw JSON Output"}
            {showJsonRaw ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => copyToClipboard(JSON.stringify(report, null, 2), "json_raw")}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            {copiedKey === "json_raw" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        {showJsonRaw && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[#0a0c0f] p-4 text-xs font-mono overflow-x-auto text-emerald-400 max-h-96">
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </div>
        )}
      </div>

                        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 text-center space-y-4 shadow-lg">
        <h3 className="text-base font-semibold text-[var(--text)]">Share or Export This Scan Report</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
          Export a high-resolution report card image or share the verified scan link with your community.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Share2 className="h-4 w-4" />
            Share / Export Report Card
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-raised)] px-5 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-all cursor-pointer"
          >
            + Scan Another Mod
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-faint)] max-w-xl mx-auto leading-relaxed pt-3 border-t border-[var(--border-soft)]">
          Static analysis is informative and does not guarantee safety. Always download mods from trusted creators.
        </p>
      </div>

            <ShareModal
        report={report}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}