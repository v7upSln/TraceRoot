import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  Download,
  Layers,
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  UploadCloud,
  FileText,
} from "lucide-react";
import { Seo } from "../components/Seo";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8080" : "https://traceroot-be.onrender.com");

interface ModCatalogEntry {
  slug: string;
  name: string;
  summary: string;
  icon_url: string;
  modrinth_url: string;
  downloads: number;
  categories: string[];
  latest_version: string;
  sha256: string;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | string;
  risk_score: number;
  updated_at: string;
}

interface PageData {
  mod: ModCatalogEntry;
  report: any;
}

export function ModReport() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/mods/${slug}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Mod "${slug}" is not currently in our safety index.`);
          }
          throw new Error("Failed to load mod report.");
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const copySha256 = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading security audit report for {slug}...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-[var(--text)]">Mod Report Not Found</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{error || "This mod has not been indexed yet."}</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/mods"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-surface-raised)]"
          >
            <ArrowLeft className="h-4 w-4" /> Browse Mod Catalog
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            <UploadCloud className="h-4 w-4" /> Scan a Custom File
          </Link>
        </div>
      </div>
    );
  }

  const { mod, report } = data;
  const isClean = mod.verdict === "CLEAN" || mod.risk_score === 0;
  const isSuspicious = mod.verdict === "SUSPICIOUS" || (mod.risk_score > 0 && mod.risk_score < 50);

  const formattedDownloads = mod.downloads
    ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(mod.downloads)
    : "N/A";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": mod.name,
    "operatingSystem": "Cross-platform",
    "applicationCategory": "GameApplication",
    "softwareVersion": mod.latest_version,
    "description": mod.summary,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "securityVerdict",
        "value": mod.verdict
      },
      {
        "@type": "PropertyValue",
        "name": "riskScore",
        "value": String(mod.risk_score)
      },
      {
        "@type": "PropertyValue",
        "name": "sha256",
        "value": mod.sha256
      }
    ]
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Seo
        title={`Is ${mod.name} Safe? Security Scan Report | TraceRoot`}
        description={`TraceRoot safety audit report for ${mod.name} v${mod.latest_version}. Safety Verdict: ${mod.verdict} (Risk Score: ${mod.risk_score}/100). Verified SHA-256 hash.`}
        path={`/mods/${slug}`}
        jsonLd={jsonLd}
      />

      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link to="/" className="hover:text-[var(--text)]">Home</Link>
        <span>/</span>
        <Link to="/mods" className="hover:text-[var(--text)]">Mods Catalog</Link>
        <span>/</span>
        <span className="text-[var(--text)] font-medium">{mod.name}</span>
      </nav>

      {/* Mod Header Hero Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {mod.icon_url ? (
              <img
                src={mod.icon_url}
                alt={`${mod.name} Icon`}
                className="h-16 w-16 rounded-xl border border-[var(--border)] object-cover bg-black/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-raised)] text-xl font-bold text-[var(--text-muted)]">
                {mod.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--text)]">Is {mod.name} Safe?</h1>
                <a
                  href={mod.modrinth_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Modrinth <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] max-w-xl">{mod.summary}</p>
              
              {/* Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]">
                  <Download className="h-3 w-3" /> {formattedDownloads} downloads
                </span>
                {mod.latest_version && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]">
                    <Layers className="h-3 w-3" /> v{mod.latest_version}
                  </span>
                )}
                {mod.categories.slice(0, 3).map((cat) => (
                  <span key={cat} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 capitalize">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Verdict Status Box */}
          <div className={`w-full md:w-auto flex flex-col items-center justify-center rounded-xl p-4 border min-w-[200px] text-center ${
            isClean
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : isSuspicious
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            {isClean ? (
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            ) : isSuspicious ? (
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-rose-400" />
            )}
            <div className="mt-2 text-lg font-bold tracking-wide">
              {isClean ? "CLEAN & SAFE" : isSuspicious ? "SUSPICIOUS PATTERNS" : "HIGH RISK DETECTED"}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">
              Risk Score: {mod.risk_score} / 100
            </div>
          </div>
        </div>
      </div>

      {/* Verified SHA-256 Hash Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-[var(--text)]">Verified SHA-256 Hash:</span>
            <div className="font-mono text-[11px] text-[var(--text-muted)] break-all mt-0.5">
              {mod.sha256}
            </div>
          </div>
          <button
            onClick={() => copySha256(mod.sha256)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-raised)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--border)] shrink-0 cursor-pointer"
          >
            {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedHash ? "Copied" : "Copy Hash"}
          </button>
        </div>
      </div>

      {/* Scan Report Findings */}
      {report ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--accent)]" /> Security Findings Summary
            </h2>

            {report.findings && report.findings.length > 0 ? (
              <div className="space-y-3">
                {report.findings.map((finding: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-amber-400">
                      <span>{finding.category || "Detection"}</span>
                      <span className="uppercase text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono">
                        {finding.severity || "warning"}
                      </span>
                    </div>
                    <p className="mt-1 text-[var(--text)]">{finding.summary}</p>
                    {finding.detail && <p className="mt-1 text-[var(--text-muted)] font-mono text-[11px]">{finding.detail}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <div>
                  <span className="font-semibold">No Malicious Code Detected</span>
                  <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                    TraceRoot bytecode analysis checked for token stealers, Discord webhooks, unauthorized execution routines, and RAT signatures. Zero suspicious behavior patterns matched.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick upload / permalink box */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-raised)] p-6 text-center">
            <h3 className="text-sm font-semibold text-[var(--text)]">Downloaded a custom `.jar` for {mod.name}?</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Ensure your downloaded file matches this official SHA-256 hash or run static bytecode analysis on your file.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                to={`/report/${mod.sha256}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--border)]"
              >
                View Full Technical Scan Permalink
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                <UploadCloud className="h-4 w-4" /> Upload & Scan Your File
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center text-xs text-[var(--text-muted)]">
          Basic catalog entry verified. Detailed bytecode report available on request.
        </div>
      )}
    </div>
  );
}
