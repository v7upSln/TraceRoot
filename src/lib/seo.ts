export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "https://traceroot.xyz";
export const GA_MEASUREMENT_ID = "G-9MS9K2PV94";

export const DEFAULT_TITLE = "TraceRoot | Minecraft Mod Safety Scanner";
export const DEFAULT_DESCRIPTION =
  "Free Minecraft mod security scanner. Check CurseForge and Modrinth jar files for token stealers, hidden class loaders, and malware without running the mod.";

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

