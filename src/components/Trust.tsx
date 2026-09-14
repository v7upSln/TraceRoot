import { ShieldCheck, UserX, GitFork } from "lucide-react";

const points = [
  {
    icon: ShieldCheck,
    label: "Static analysis only",
    body: "The file is read and parsed, never run. There is no environment for it to do anything in.",
  },
  {
    icon: UserX,
    label: "No account, no catch",
    body: "One-off scans are free indefinitely. An account is only needed for ongoing monitoring.",
  },
  {
    icon: GitFork,
    label: "Open source",
    body: "The site and API are public. Detection rules stay private so reports cannot be used to slip past them.",
  },
];

export function Trust() {
  return (
    <section className="border-t border-[var(--border-soft)] bg-[var(--bg-surface)]/30">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 py-14 sm:grid-cols-3 sm:px-10">
        {points.map(({ icon: Icon, label, body }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-5"
          >
            <Icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
            <h3 className="mt-3 text-sm font-medium text-[var(--text)]">{label}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
