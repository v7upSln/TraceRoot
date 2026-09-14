import { ArrowRight } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";

export function GithubBanner() {
  return (
    <div className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-6 py-2 text-xs text-[var(--text-muted)] sm:px-10">
        <GithubIcon className="hidden h-3.5 w-3.5 flex-shrink-0 text-[var(--accent)] sm:block" />
        <p className="text-center">
          TraceRoot is free and open source
          <a
            href="https://github.com/v7upSln/TraceRoot"
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center gap-1 font-medium text-[var(--text)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
          >
            view it on GitHub
            <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </a>
        </p>
      </div>
    </div>
  );
}
