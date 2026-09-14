import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export function StyledDropdown<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: DropdownOption<T>[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] py-1 px-3 text-xs text-[var(--text)] transition-colors hover:border-[var(--accent-dim)]"
      >
        {current.label}
        <ChevronDown
          className={`h-3 w-3 text-[var(--text-faint)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1.5 w-64 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface-raised)] py-1 shadow-lg shadow-black/30"
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            const isDisabled = !!opt.disabled;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  disabled={isDisabled}
                  aria-selected={selected}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed text-[var(--text-faint)]"
                      : selected
                      ? "bg-[var(--accent-soft)] text-[var(--text)] font-medium"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
