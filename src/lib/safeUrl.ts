/** Return an absolute HTTPS URL suitable for use as a browser navigation or image URL. */
export function getSafeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

/** Restrict catalog links to Modrinth itself, including its official subdomains. */
export function getSafeModrinthUrl(value: unknown): string | undefined {
  const safeUrl = getSafeHttpsUrl(value);
  if (!safeUrl) return undefined;

  const hostname = new URL(safeUrl).hostname.toLowerCase();
  return hostname === "modrinth.com" || hostname.endsWith(".modrinth.com")
    ? safeUrl
    : undefined;
}
