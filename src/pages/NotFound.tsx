import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion, Home as HomeIcon, BookOpen, ShieldCheck } from "lucide-react";
import { Seo } from "../components/Seo";

export function NotFound() {
  return (
    <div className="px-6 py-16 sm:px-10 max-w-3xl mx-auto text-center font-sans">
      <Seo
        title="404 — Page Not Found"
        description="The requested page could not be found on TraceRoot. Search or scan a Minecraft mod jar file."
        path="/404"
        noindex={true}
      />

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg">
        <FileQuestion className="h-10 w-10" strokeWidth={1.75} />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
        404 — Page Not Found
      </h1>
      
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] max-w-md mx-auto">
        Sorry, the page or scan report you are looking for doesn't exist or may have been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-all"
        >
          <HomeIcon className="h-4 w-4" />
          <span>Back to Mod Scanner</span>
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-all"
        >
          <BookOpen className="h-4 w-4 text-[var(--accent)]" />
          <span>Read Security Guides</span>
        </Link>
      </div>

      <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-left shadow-sm max-w-xl mx-auto">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
          <span>Popular TraceRoot Pages</span>
        </h2>
        <ul className="space-y-2.5 text-xs">
          <li>
            <Link
              to="/"
              className="text-[var(--text)] hover:text-[var(--accent)] font-medium flex items-center justify-between transition-colors"
            >
              <span>Scan a Minecraft Mod / Plugin (.jar)</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[var(--text-faint)]" />
            </Link>
          </li>
          <li>
            <Link
              to="/blog/how-to-tell-if-a-minecraft-mod-has-malware"
              className="text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-between transition-colors"
            >
              <span>Guide: How to tell if a Minecraft mod has malware</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[var(--text-faint)]" />
            </Link>
          </li>
          <li>
            <Link
              to="/blog/how-traceroot-scans-mods"
              className="text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-between transition-colors"
            >
              <span>Guide: How TraceRoot static analysis works</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[var(--text-faint)]" />
            </Link>
          </li>
          <li>
            <Link
              to="/privacy"
              className="text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-between transition-colors"
            >
              <span>Privacy Policy &amp; Data Security</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[var(--text-faint)]" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
