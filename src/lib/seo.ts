export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "https://traceroot.xyz";
export const GA_MEASUREMENT_ID = "G-9MS9K2PV94";

export const DEFAULT_TITLE = "TraceRoot — Free Minecraft Mod Malware & Virus Scanner (.jar)";
export const DEFAULT_DESCRIPTION =
  "Scan Minecraft mods & plugins (.jar) for token stealers, RATs, Fractureiser, and hidden malware before putting them in your mods folder. Free static bytecode analysis for Fabric, Forge, NeoForge, & Bukkit.";

export type VerdictKind = "safe" | "suspicious" | "malicious";

export function getVerdict(level?: string, score?: number): VerdictKind {
  const l = (level || "safe").toLowerCase();
  const s = score ?? 0;
  if (s === 0 || l === "safe") return "safe";
  if (l === "malicious" || l === "critical" || l === "high" || s >= 40) return "malicious";
  return "suspicious";
}

export function verdictLabel(kind: VerdictKind): string {
  if (kind === "safe") return "Safe";
  if (kind === "suspicious") return "Suspicious";
  return "Malicious";
}

