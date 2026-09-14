import { UploadCloud, ScanSearch, FileCheck2 } from "lucide-react";

const steps = [
  { icon: UploadCloud, title: "Upload", body: "Drop a .jar file or paste a Modrinth link." },
  { icon: ScanSearch, title: "Scan", body: "We inspect the bytecode and metadata without ever running the file." },
  { icon: FileCheck2, title: "Report", body: "Get a clear safety summary and findings you can share." },
];

export function Steps() {
  return (
    <section id="how-it-works" className="border-t border-[var(--border-soft)]">
      <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">
          How it works
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)]">
                <Icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
              </div>
              <h3 className="mt-3 text-sm font-medium text-[var(--text)]">
                {i + 1}. {title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
