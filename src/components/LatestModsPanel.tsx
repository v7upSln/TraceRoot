import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle, ArrowRight, Sparkles, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8080" : "https://traceroot-be.onrender.com");

interface ModItem {
  slug: string;
  name: string;
  summary: string;
  icon_url: string;
  downloads: number;
  latest_version: string;
  verdict: string;
  risk_score: number;
}

export function LatestModsPanel() {
  const [mods, setMods] = useState<ModItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/mods`)
      .then((res) => res.json())
      .then((data) => {
        if (data.mods) {
          setMods(data.mods.slice(0, 5));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch latest mods for panel:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)]/50 p-4 text-center">
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-[var(--text-muted)]" />
        <span className="mt-1.5 block text-[11px] text-[var(--text-muted)]">Loading catalog...</span>
      </div>
    );
  }

  if (mods.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)]/40 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2.5 mb-2.5">
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)] opacity-80" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider">Recently Verified</h2>
        </div>
        <Link
          to="/mods"
          className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-0.5"
        >
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {mods.map((mod) => {
          const isClean = mod.verdict === "CLEAN" || mod.risk_score === 0;

          return (
            <Link
              key={mod.slug}
              to={`/mods/${mod.slug}`}
              className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[var(--bg-surface-raised)] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {mod.icon_url ? (
                  <img
                    src={mod.icon_url}
                    alt={mod.name}
                    className="h-7 w-7 rounded-md border border-[var(--border-soft)] object-cover bg-black/20 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-soft)] bg-[var(--bg-surface-raised)] text-[10px] font-bold text-[var(--text-muted)] shrink-0">
                    {mod.name.charAt(0)}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors truncate">
                    {mod.name}
                  </div>
                  <span className="text-[9px] text-[var(--text-faint)] font-mono">
                    {mod.latest_version ? `v${mod.latest_version}` : "Verified"}
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
    </aside>
  );
}
