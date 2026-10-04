import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle, Activity, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8080" : "https://traceroot-be.onrender.com");

interface ScanItem {
  sha256: string;
  file_name: string;
  verdict: string;
  risk_score: number;
  scanned_at?: string;
  mod_slug?: string;
  mod_name?: string;
  icon_url?: string;
}

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return "Recently";
  try {
    const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 30) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

const CACHE_KEY = "traceroot:recent-scans:v1";
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // show cached data instantly if <10 min old
const REFRESH_INTERVAL_MS = 60 * 1000;

function readCachedScans(): ScanItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ts: number; scans: ScanItem[] };
    if (!Array.isArray(parsed.scans) || Date.now() - parsed.ts > CACHE_MAX_AGE_MS) return [];
    return parsed.scans;
  } catch {
    return [];
  }
}

function writeCachedScans(scans: ScanItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), scans }));
  } catch {
    // storage unavailable (private mode / quota) - ignore
  }
}

export function LatestModsPanel() {
  // Stale-while-revalidate: paint last known scans immediately, refresh in the background.
  const [scans, setScans] = useState<ScanItem[]>(() => readCachedScans());
  const [loading, setLoading] = useState(() => readCachedScans().length === 0);

  const fetchRecentScans = useCallback((signal?: AbortSignal) => {
    // Plain GET with no custom headers: avoids a CORS preflight round trip and lets the
    // browser/CDN honor the server's Cache-Control (public, short max-age).
    fetch(`${API_BASE_URL}/api/scans/recent?limit=6`, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.scans)) {
          setScans(data.scans);
          writeCachedScans(data.scans);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Failed to fetch recent scans:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecentScans(controller.signal);

    // Refresh periodically, but only while the tab is visible.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchRecentScans();
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchRecentScans]);

  if (loading && scans.length === 0) {
    return (
      <aside className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)]/40 p-4 backdrop-blur-sm text-center">
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-[var(--text-muted)]" />
        <span className="mt-1.5 block text-[11px] text-[var(--text-muted)]">Loading recent scans...</span>
      </aside>
    );
  }

  return (
    <aside className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)]/40 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2.5 mb-2.5">
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Activity className="h-3.5 w-3.5 text-[var(--accent)] opacity-80 animate-pulse" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider">Recent Scans</h2>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="py-4 text-center text-xs text-[var(--text-muted)]">
          No recent scan activity recorded.
        </div>
      ) : (
        <div className="space-y-1.5">
          {scans.map((scan, idx) => {
            const isClean = scan.verdict === "CLEAN" || scan.risk_score === 0;
            const displayName = scan.mod_name || scan.file_name;

            return (
              <Link
                key={`${scan.sha256 || scan.mod_slug || idx}-${idx}`}
                to={scan.sha256 ? `/report/${scan.sha256}` : scan.mod_slug ? `/mods/${scan.mod_slug}` : "/"}
                className="flex items-center justify-between rounded-lg p-2 bg-[var(--bg-surface)]/20 hover:bg-[var(--bg-surface-raised)]/60 transition-colors border border-transparent hover:border-[var(--border-soft)]"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {scan.icon_url ? (
                    <img
                      src={scan.icon_url}
                      alt={displayName}
                      className="h-7 w-7 rounded-md border border-[var(--border-soft)] object-cover bg-black/20 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-soft)] bg-[var(--bg-surface-raised)] text-[10px] font-bold text-[var(--text-muted)] shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-medium text-[var(--text)] truncate max-w-[140px]">
                      {displayName}
                    </div>
                    <span className="text-[9px] text-[var(--text-faint)] font-mono">
                      {formatTimeAgo(scan.scanned_at)}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium shrink-0 ml-1.5 ${
                    isClean
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {isClean ? <ShieldCheck className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                  {isClean ? "Clean" : "Risk"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
