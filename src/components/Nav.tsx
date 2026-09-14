import { Link, useLocation } from "react-router-dom";

export function Nav() {
  const { pathname } = useLocation();
  const onReport = pathname.startsWith("/report/") || pathname.startsWith("/scan/");

  return (
    <header className="border-b border-[var(--border-soft)] bg-[var(--bg-base)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 sm:px-10">
        <Link
          to="/"
          className="font-semibold tracking-tight text-[var(--text)] transition-colors hover:text-[var(--accent)]"
        >
          TraceRoot
        </Link>

        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          {!onReport && (
            <a href="/#how-it-works" className="hidden transition-colors hover:text-[var(--text)] sm:inline">
              How it works
            </a>
          )}
          <Link to="/blog" className="transition-colors hover:text-[var(--text)]">
            Blog
          </Link>
          <span className="hidden text-[var(--text-faint)] md:inline">free &amp; open source</span>
        </div>
      </div>
    </header>
  );
}
