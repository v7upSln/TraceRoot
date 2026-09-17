import { History, ShieldCheck, Zap, Sparkles } from "lucide-react";

interface ReleaseNote {
  version: string;
  tag: string;
  isCurrent?: boolean;
  date: string;
  highlights: string[];
}

const RELEASES: ReleaseNote[] = [
  {
    version: "v0.3",
    tag: "Current Release",
    isCurrent: true,
    date: "Latest Version",
    highlights: [
      "Enhanced bytecode heuristics & string entropy inspection",
      "Optimized SHA-256 database caching for instant lookups",
      "Improved URL analysis and direct Modrinth file support",
      "Updated threat signature database for Java bytecodes",
    ],
  },
  {
    version: "v0.2",
    tag: "Heuristics Update",
    date: "Previous",
    highlights: [
      "Added detection for Discord webhook payload stealers & RAT signatures",
      "Multi-file archive parsing and nested JAR file inspection",
      "Expanded detection for suspicious class loaders and reflection calls",
    ],
  },
  {
    version: "v0.1",
    tag: "Initial Engine",
    date: "Initial Release",
    highlights: [
      "Initial launch of TraceRoot static security scanner",
      "SHA-256 / SHA-1 hash lookup database integration",
      "Basic file integrity verification for game mod packages",
    ],
  },
];

export function ScannerChangelog() {
  return (
    <section className="mt-12 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)]/30 p-5 sm:p-7 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
              Scanner Engine Changelog
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Continuous security pattern updates &amp; detection engine enhancements
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Current Engine: v0.3
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {RELEASES.map((rel) => (
          <div
            key={rel.version}
            className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
              rel.isCurrent
                ? "border-[var(--accent)]/40 bg-[var(--bg-surface-raised)]/60 shadow-sm"
                : "border-[var(--border-soft)] bg-[var(--bg-surface)]/40 opacity-90 hover:opacity-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold text-[var(--text)]">
                    {rel.version}
                  </span>
                  {rel.isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--accent)]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--accent)]">
                      <Sparkles className="h-2.5 w-2.5" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-faint)]">{rel.tag}</span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-faint)] font-mono">{rel.date}</span>
              </div>

              <ul className="space-y-2 text-[11px] text-[var(--text-muted)]">
                {rel.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="mt-1 h-1 w-1 rounded-full bg-[var(--accent)] shrink-0 opacity-70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {rel.isCurrent && (
              <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-[10px] text-[var(--text-faint)]">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Zero false positive optimization
                </span>
                <Zap className="h-3 w-3 text-[var(--accent)]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
