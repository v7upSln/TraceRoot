import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ShieldCheck, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { Seo } from "../components/Seo";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8080" : "https://traceroot-be.onrender.com");

interface ModItem {
  slug: string;
  name: string;
  summary: string;
  icon_url: string;
  downloads: number;
  categories: string[];
  latest_version: string;
  sha256: string;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | string;
  risk_score: number;
}

export function ModsDirectory() {
  const [mods, setMods] = useState<ModItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/mods`)
      .then((res) => res.json())
      .then((data) => {
        setMods(data.mods || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load mod catalog:", err);
        setLoading(false);
      });
  }, []);

  const filteredMods = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mods;
    return mods.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.slug.toLowerCase().includes(query) ||
        (m.summary && m.summary.toLowerCase().includes(query))
    );
  }, [mods, searchQuery]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Seo
        title="Popular Minecraft Mods Security Directory | TraceRoot"
        description="Browse security audit reports and verified SHA-256 hashes for popular Minecraft mods (Sodium, OptiFine, JEI, WorldEdit). Verify mod safety before installation."
      />

      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Minecraft Mod Safety Catalog</h1>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          TraceRoot continuously scans and verifies SHA-256 hashes for popular Minecraft mods to protect players from token stealers, RATs, and hidden malware.
        </p>

        {/* Search Input */}
        <div className="relative mt-6 max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mods (e.g. Sodium, WorldEdit, JEI)..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-xs text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="mt-4 text-xs text-[var(--text-muted)]">Loading mod safety index...</p>
        </div>
      ) : filteredMods.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center text-xs text-[var(--text-muted)]">
          {searchQuery ? `No mods matching "${searchQuery}" found.` : "No mods currently indexed in catalog."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMods.map((mod) => {
            const isClean = mod.verdict === "CLEAN" || mod.risk_score === 0;
            const formattedDownloads = mod.downloads
              ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(mod.downloads)
              : "";

            return (
              <Link
                key={mod.slug}
                to={`/mods/${mod.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition-all hover:border-[var(--accent)] hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {mod.icon_url ? (
                        <img
                          src={mod.icon_url}
                          alt={mod.name}
                          className="h-10 w-10 rounded-lg border border-[var(--border)] object-cover bg-black/20 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-raised)] text-sm font-bold text-[var(--text-muted)] shrink-0">
                          {mod.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                          {mod.name}
                        </h2>
                        {mod.latest_version && (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">v{mod.latest_version}</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                        isClean
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {isClean ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {isClean ? "Clean" : "Warning"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[var(--text-muted)] line-clamp-2">{mod.summary || "Minecraft mod security scan report and verified file hashes."}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[11px] text-[var(--text-muted)]">
                  <span>{formattedDownloads ? `${formattedDownloads} downloads` : "Verified Mod"}</span>
                  <span className="flex items-center gap-1 text-[var(--accent)] font-medium group-hover:translate-x-0.5 transition-transform">
                    Is {mod.name} safe? <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
