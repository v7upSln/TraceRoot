import { useEffect, useRef, useState } from "react";

const WORDS = ["safe", "clean", "legit"];
const SIZER = WORDS.reduce((a, b) => (b.length > a.length ? b : a));

export function ToggleWord() {
  const [checked, setChecked] = useState(false);
  const [slotA, setSlotA] = useState(WORDS[0]);
  const [slotB, setSlotB] = useState(WORDS[1]);
  const nextIndex = useRef(2);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = setInterval(() => {
      setChecked((wasChecked) => {
        const next = !wasChecked;
        const word = WORDS[nextIndex.current % WORDS.length];
        if (next) setSlotA(word);
        else setSlotB(word);
        nextIndex.current += 1;
        return next;
      });
    }, 2000);

    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden align-baseline font-semibold">
      <span className="invisible">{SIZER}</span>

      <span
        className={`absolute inset-0 text-[var(--accent)] transition-all duration-200 ease-out ${
          checked ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {slotA}
      </span>
      <span
        className={`absolute inset-0 text-[var(--accent)] transition-all duration-200 ease-out ${
          checked ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {slotB}
      </span>
    </span>
  );
}
