import { Link } from "react-router-dom";
import { GitFork } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-soft)] bg-[var(--bg-surface)]/40">
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">TraceRoot</p>
            <p className="max-w-sm text-xs leading-relaxed text-[var(--text-faint)]">
              Informational only, not a guarantee of safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--text-faint)]">
            <Link to="/blog" className="transition-colors hover:text-[var(--text-muted)]">
              Blog
            </Link>
            <Link to="/blog/how-traceroot-scans-mods" className="transition-colors hover:text-[var(--text-muted)]">
              How detection works
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-[var(--text-muted)]">
              Privacy
            </Link>
            <a
              href="https://github.com/v7upSln/TraceRoot/fork"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--text-muted)]"
            >
              <GitFork className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={1.75} />
              Fork me
            </a>
            <a
              href="https://github.com/v7upSln/TraceRoot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--text-muted)]"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>

        <p className="mt-8 border-t border-[var(--border-soft)] pt-6 text-center text-[11px] text-[var(--text-faint)]">
          traceroot.xyz
        </p>
      </div>
    </footer>
  );
}
