export function ScannerChangelog() {
  const releases = [
    {
      version: "v0.3",
      isCurrent: true,
      description: "Enhanced bytecode heuristics, optimized SHA-256 caching speed, and improved Modrinth URL analysis.",
    },
    {
      version: "v0.2",
      isCurrent: false,
      description: "Added Discord webhook stealer detection, multi-file archive parsing, and class loader pattern checks.",
    },
    {
      version: "v0.1",
      isCurrent: false,
      description: "Initial release of TraceRoot scanner engine with basic JAR file analysis and hash lookup database.",
    },
  ];

  return (
    <div className="mt-12 max-w-xl mx-auto border-t border-[var(--border-soft)] pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Scanner Changelog
        </h3>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Current: v0.3
        </span>
      </div>

      <div className="space-y-3">
        {releases.map((rel) => (
          <div key={rel.version} className="flex items-start gap-3 text-xs">
            <span
              className={`font-mono font-semibold shrink-0 w-10 text-right ${
                rel.isCurrent ? "text-[var(--accent)]" : "text-[var(--text-faint)]"
              }`}
            >
              {rel.version}
            </span>
            <div className="flex-1 text-[var(--text-muted)] leading-normal">
              {rel.isCurrent && (
                <span className="inline-block rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--accent)] mr-2">
                  latest
                </span>
              )}
              {rel.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
