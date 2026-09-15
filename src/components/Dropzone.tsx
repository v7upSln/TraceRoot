import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Link2,
  FileArchive,
  Loader2,
  Search,
  Hash,
  Clipboard,
  X,
  ArrowRight,
} from "lucide-react";
import { StatusMessage } from "./StatusMessage";
import { StyledDropdown, type DropdownOption } from "./StyledDropdown";

type ModType = "minecraft" | "cod";
type InputTab = "upload" | "url" | "hash";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAE0aSsa8Arz0TOvq";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (error?: any) => void;
          "expired-callback"?: () => void;
          action?: string;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

const MOD_TYPES: Record<
  ModType,
  { label: string; ext: string; accept: Record<string, string[]>; hint: string }
> = {
  minecraft: {
    label: "Minecraft plugin/mod (.jar)",
    ext: ".jar",
    accept: { "application/java-archive": [".jar"], "application/zip": [".jar"] },
    hint: "Paste a Modrinth mod URL",
  },
  cod: {
    label: "Call of Duty script (.gsc)",
    ext: ".gsc",
    accept: { "text/plain": [".gsc"] },
    hint: "link to a .gsc script",
  },
};

const MOD_TYPE_OPTIONS: DropdownOption<ModType>[] = [
  { value: "minecraft", label: "Minecraft plugin/mod (.jar)" },
  { value: "cod", label: "Call of Duty script (.gsc) (coming soon)", disabled: true },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://traceroot-be.onrender.com";

type ScanState = "idle" | "scanning" | "searching";

const HASH_REGEX_SHA256 = /^[a-fA-F0-9]{64}$/;
const HASH_REGEX_SHA1 = /^[a-fA-F0-9]{40}$/;
const HEX_ONLY_REGEX = /^[a-fA-F0-9]*$/;

export function Dropzone() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InputTab>("upload");
  const [modType, setModType] = useState<ModType>("minecraft");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [hashQuery, setHashQuery] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notFoundHash, setNotFoundHash] = useState<string | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const current = MOD_TYPES[modType];

  useEffect(() => {
    let intervalId: any;
    const initTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => setTurnstileToken(token),
            "expired-callback": () => setTurnstileToken(""),
            "error-callback": () => setTurnstileToken(""),
            theme: "dark",
          });
        } catch (e) {
          console.warn("Turnstile widget render warning:", e);
        }
      }
    };

    initTurnstile();
    if (!widgetIdRef.current) {
      intervalId = setInterval(() => {
        if (window.turnstile) {
          initTurnstile();
          if (widgetIdRef.current) clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const hashValidation = useMemo(() => {
    const raw = hashQuery.trim();
    if (!raw) return { isValid: false, type: null, isHex: true, len: 0 };
    const isHex = HEX_ONLY_REGEX.test(raw);
    const len = raw.length;

    if (HASH_REGEX_SHA256.test(raw)) {
      return { isValid: true, type: "SHA-256", isHex: true, len };
    }
    if (HASH_REGEX_SHA1.test(raw)) {
      return { isValid: true, type: "SHA-1", isHex: true, len };
    }

    return { isValid: false, type: null, isHex, len };
  }, [hashQuery]);

  const getActiveTurnstileToken = useCallback(async (): Promise<string> => {
    if (turnstileToken) return turnstileToken;
    if (window.turnstile && widgetIdRef.current) {
      try {
        const resp = window.turnstile.getResponse(widgetIdRef.current);
        if (resp) {
          setTurnstileToken(resp);
          return resp;
        }
        for (let i = 0; i < 4; i++) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          const retryResp = window.turnstile.getResponse(widgetIdRef.current);
          if (retryResp) {
            setTurnstileToken(retryResp);
            return retryResp;
          }
        }
      } catch (e) {
        console.warn("Turnstile getResponse warning:", e);
      }
    }
    return "";
  }, [turnstileToken]);

  const handleUploadAndScan = useCallback(
    async (fileToScan: File) => {
      if (fileToScan.size > MAX_FILE_SIZE_BYTES) {
        setErrorMsg(
          `File "${fileToScan.name}" exceeds the maximum allowed size of 50 MB (${(
            fileToScan.size /
            (1024 * 1024)
          ).toFixed(1)} MB).`
        );
        setScanState("idle");
        return;
      }

      setFile(fileToScan);
      setScanState("scanning");
      setErrorMsg(null);
      setNotFoundHash(null);

      const activeToken = await getActiveTurnstileToken();
      const formData = new FormData();
      formData.append("file", fileToScan);

      const reqHeaders: Record<string, string> = {};
      if (activeToken) {
        reqHeaders["X-Turnstile-Token"] = activeToken;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/scan`, {
          method: "POST",
          headers: reqHeaders,
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Scan request failed" }));
          let detailMsg = `Scan failed with status ${response.status}`;
          if (errorData && errorData.detail) {
            if (typeof errorData.detail === "string") {
              detailMsg = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
              detailMsg = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
            } else {
              detailMsg = JSON.stringify(errorData.detail);
            }
          }
          throw new Error(detailMsg);
        }

        const report = await response.json();

        if (report.sha256) {
          sessionStorage.setItem(`scan_${report.sha256}`, JSON.stringify(report));
          sessionStorage.setItem("latest_scan", JSON.stringify(report));
        }

        navigate(`/report/${report.sha256 || "latest"}`, { state: { report } });
      } catch (err: any) {
        console.error("Scan error:", err);
        const isFetchError = err?.message === "Failed to fetch" || err?.name === "TypeError";
        setErrorMsg(
          isFetchError
            ? "Unable to reach the backend scanner service. The server may be waking up from cold start or blocked by network CORS policies. Please wait 15-30 seconds and try again."
            : err.message || "Failed to reach backend scanner service."
        );
        setScanState("idle");
      } finally {
        if (window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.reset(widgetIdRef.current);
            setTurnstileToken("");
          } catch (e) {}
        }
      }
    },
    [navigate, getActiveTurnstileToken]
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      if (rejected && rejected.length > 0) {
        setErrorMsg("File upload rejected. Please ensure you upload a valid .jar file under 50 MB.");
        return;
      }
      if (accepted[0]) {
        handleUploadAndScan(accepted[0]);
      }
    },
    [handleUploadAndScan]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
    accept: current.accept,
  });

  async function scanLink() {
    const trimmedLink = link.trim();
    if (!trimmedLink) return;

    const isModrinthPage = trimmedLink.startsWith("https://modrinth.com/") || trimmedLink.startsWith("https://www.modrinth.com/");
    const isModrinthCdn = trimmedLink.startsWith("https://cdn.modrinth.com/data/");

    if (!isModrinthPage && !isModrinthCdn) {
      setErrorMsg(
        "Please enter a valid Modrinth URL: either a mod page (https://modrinth.com/mod/...) or a direct CDN link (https://cdn.modrinth.com/data/...)"
      );
      return;
    }

    setErrorMsg(null);
    setNotFoundHash(null);
    setFile(null);
    setScanState("scanning");

    const activeToken = await getActiveTurnstileToken();
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (activeToken) {
      reqHeaders["X-Turnstile-Token"] = activeToken;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/scan-url`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({ url: trimmedLink }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "URL scan request failed" }));
        let detailMsg = `URL scan failed with HTTP ${response.status}`;
        if (errorData && errorData.detail) {
          if (typeof errorData.detail === "string") {
            detailMsg = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            detailMsg = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
          } else {
            detailMsg = JSON.stringify(errorData.detail);
          }
        }
        throw new Error(detailMsg);
      }

      const report = await response.json();

      if (report.sha256) {
        sessionStorage.setItem(`scan_${report.sha256}`, JSON.stringify(report));
        sessionStorage.setItem("latest_scan", JSON.stringify(report));
      }

      navigate(`/report/${report.sha256 || "latest"}`, { state: { report } });
    } catch (err: any) {
      console.error("URL Scan error:", err);
      const isFetchError = err?.message === "Failed to fetch" || err?.name === "TypeError";
      setErrorMsg(
        isFetchError
          ? "Unable to reach the backend scanner service. The server may be waking up from cold start or blocked by network CORS policies. Please wait 15-30 seconds and try again."
          : err.message || "Failed to scan mod URL."
      );
      setScanState("idle");
    } finally {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
          setTurnstileToken("");
        } catch (e) {}
      }
    }
  }

  async function searchHash() {
    const cleanHash = hashQuery.trim().toLowerCase();
    if (!cleanHash) return;

    if (!hashValidation.isValid) {
      setErrorMsg("Please enter a valid 64-character SHA-256 or 40-character SHA-1 hash.");
      return;
    }

    setErrorMsg(null);
    setNotFoundHash(null);
    setScanState("searching");

    try {
      const response = await fetch(`${API_BASE_URL}/search/hash/${cleanHash}`);

      if (response.status === 404) {
        setNotFoundHash(cleanHash);
        setErrorMsg(`No cached scan report found for hash "${cleanHash}". This file has not been scanned yet.`);
        setScanState("idle");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Search failed" }));
        let detailMsg = errorData?.detail || `Search failed with status ${response.status}`;
        throw new Error(detailMsg);
      }

      const report = await response.json();

      if (report.sha256) {
        sessionStorage.setItem(`scan_${report.sha256}`, JSON.stringify(report));
        sessionStorage.setItem("latest_scan", JSON.stringify(report));
      }

      navigate(`/report/${report.sha256 || cleanHash}`, { state: { report } });
    } catch (err: any) {
      console.error("Hash search error:", err);
      const isFetchError = err?.message === "Failed to fetch" || err?.name === "TypeError";
      setErrorMsg(
        isFetchError
          ? "Unable to reach the backend scanner service. The server may be waking up from cold start or blocked by network CORS policies. Please wait 15-30 seconds and try again."
          : err.message || "Failed to query hash database."
      );
      setScanState("idle");
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setHashQuery(text.trim());
        setErrorMsg(null);
        setNotFoundHash(null);
      }
    } catch (e) {
      console.warn("Clipboard access not available:", e);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-center gap-2 text-xs text-[var(--text-faint)]">
        scanning for
        <StyledDropdown
          value={modType}
          onChange={(v) => {
            setModType(v);
            setFile(null);
            setScanState("idle");
            setErrorMsg(null);
            setNotFoundHash(null);
          }}
          options={MOD_TYPE_OPTIONS}
        />
      </div>

      <div className="mb-4 flex rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
            setErrorMsg(null);
            setNotFoundHash(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all cursor-pointer ${
            activeTab === "upload"
              ? "bg-[var(--bg-surface-raised)] text-[var(--text)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <UploadCloud className={`h-3.5 w-3.5 ${activeTab === "upload" ? "text-[var(--accent)]" : ""}`} />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("url");
            setErrorMsg(null);
            setNotFoundHash(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all cursor-pointer ${
            activeTab === "url"
              ? "bg-[var(--bg-surface-raised)] text-[var(--text)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Link2 className={`h-3.5 w-3.5 ${activeTab === "url" ? "text-[var(--accent)]" : ""}`} />
          <span>Mod URL</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("hash");
            setErrorMsg(null);
            setNotFoundHash(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all cursor-pointer ${
            activeTab === "hash"
              ? "bg-[var(--bg-surface-raised)] text-[var(--text)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Hash className={`h-3.5 w-3.5 ${activeTab === "hash" ? "text-[var(--accent)]" : ""}`} />
          <span>Hash Search</span>
        </button>
      </div>

      {activeTab === "upload" && (
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border px-8 py-12 text-center transition-colors ${
            isDragActive
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent-dim)]"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <>
              <FileArchive className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.75} />
              <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--text)]">
                {file.name}
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-[var(--text-muted)]" strokeWidth={1.75} />
              <p className="text-sm text-[var(--text)]">
                Drop a <span className="font-[family-name:var(--font-mono)]">{current.ext}</span> file, or click to browse
              </p>
              <p className="text-xs text-[var(--text-faint)]">
                Max file size: <span className="font-semibold text-[var(--text-muted)]">50 MB</span> • Scans automatically once dropped
              </p>
            </>
          )}
        </div>
      )}

      {activeTab === "url" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-[var(--text-faint)]">
            <span>Scan by Link</span>
            <span className="font-mono">Modrinth</span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]"
                strokeWidth={1.75}
              />
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") scanLink();
                }}
                placeholder={current.hint}
                disabled={scanState === "scanning"}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] py-2.5 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-dim)] disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={scanLink}
              disabled={!link.trim() || scanState === "scanning"}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
              style={{ background: "var(--accent)" }}
            >
              Scan URL
            </button>
          </div>
        </div>
      )}

      {activeTab === "hash" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
              <Hash className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Hash Lookup</span>
            </div>

            <div className="text-[11px]">
              {hashValidation.isValid && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {hashValidation.type} ({hashValidation.len} hex)
                </span>
              )}
              {!hashValidation.isValid && hashQuery.trim().length > 0 && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] ${
                  !hashValidation.isHex 
                    ? "border border-red-500/30 bg-red-500/10 text-red-400"
                    : "border border-[var(--border)] bg-[var(--bg-surface-raised)] text-[var(--text-muted)]"
                }`}>
                  {!hashValidation.isHex ? "Invalid hex chars" : `${hashValidation.len} / 64 hex chars`}
                </span>
              )}
              {hashQuery.trim().length === 0 && (
                <span className="text-[10px] text-[var(--text-faint)]">
                  SHA-256 • SHA-1
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={hashQuery}
                onChange={(e) => {
                  setHashQuery(e.target.value);
                  setErrorMsg(null);
                  setNotFoundHash(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchHash();
                }}
                placeholder="Paste SHA-256 or SHA-1 hash..."
                disabled={scanState === "searching"}
                className="w-full font-[family-name:var(--font-mono)] rounded-lg border border-[var(--border)] bg-[var(--bg-base)] py-2.5 pl-9 pr-16 text-xs text-[var(--text)] placeholder:font-sans placeholder:text-sm placeholder:text-[var(--text-faint)] focus:border-[var(--accent-dim)] disabled:opacity-50"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {hashQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHashQuery("");
                      setErrorMsg(null);
                      setNotFoundHash(null);
                    }}
                    className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text)] cursor-pointer"
                    title="Clear"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pasteFromClipboard}
                    className="flex items-center gap-1 rounded bg-[var(--bg-surface-raised)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="h-3 w-3" />
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={searchHash}
              disabled={!hashValidation.isValid || scanState === "searching"}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 shadow-sm cursor-pointer"
              style={{ background: "var(--accent)" }}
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span>Search previously analyzed mods</span>
          </div>
        </div>
      )}

      {/* Cloudflare Turnstile Bot Protection Widget */}
      <div className="mt-4 flex justify-center">
        <div ref={turnstileContainerRef} />
      </div>

      {(scanState === "scanning" || scanState === "searching") && (
        <div
          role="status"
          className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-3.5 px-4 shadow-sm animate-in fade-in duration-150"
        >
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text)]">
            {scanState === "searching"
              ? "Querying database for cached report..."
              : "Analyzing mod bytecode and scanning signatures..."}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4">
          <StatusMessage
            variant="error"
            title={notFoundHash ? "Report Not Found" : "Scan Error"}
            message={errorMsg}
          />
          {notFoundHash && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-muted)]">
              <span>Have the file locally?</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  setErrorMsg(null);
                  setNotFoundHash(null);
                }}
                className="flex items-center gap-1 font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                <span>Upload &amp; scan now</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

