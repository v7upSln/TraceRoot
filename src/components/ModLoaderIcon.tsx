import { useEffect, useState } from "react";

const LOADER_ICON_MAP: { match: string; src: string }[] = [
  { match: "fabric", src: "/fabric.png" },
  { match: "neoforge", src: "/neoforge.png" },
  { match: "forge", src: "/forge_logo.png" },
  { match: "quilt", src: "/quilt.png" },
  { match: "paper", src: "/paper.png" },
  { match: "spigot", src: "/spigot.png" },
  { match: "bukkit", src: "/spigot.png" }, // no dedicated bukkit.png yet, closest relative
];

const FALLBACK_SRC = "/minecraft.png";

export function ModLoaderIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const loader = name?.toLowerCase() || "";
  const entry = LOADER_ICON_MAP.find(({ match }) => loader.includes(match));
  const src = entry?.src ?? FALLBACK_SRC;

  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div
        className={`${className} rounded-sm bg-[var(--accent)]/20 shrink-0`}
        aria-label={`${name} logo unavailable`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      className={`${className} object-contain shrink-0`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}