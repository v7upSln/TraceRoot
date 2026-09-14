import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import type { ScanReport } from "../pages/Report";
import { SITE_URL, getVerdict, verdictLabel } from "../lib/seo";
import { ModLoaderIcon } from "./ModLoaderIcon";

interface ShareModalProps {
  report: ScanReport;
  isOpen: boolean;
  onClose: () => void;
}

const LOADER_IMG_MAP: Record<string, string> = {
  fabric: "/fabric.png",
  neoforge: "/neoforge.png",
  forge: "/forge_logo.png",
  quilt: "/quilt.png",
  paper: "/paper.png",
  spigot: "/spigot.png",
  bukkit: "/spigot.png",
};

export function ShareModal({ report, isOpen, onClose }: ShareModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const verdict = getVerdict(report.risk_level, report.risk_score);
  const reportUrl = `${SITE_URL}/report/${report.sha256}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const drawCardToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement("canvas");
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const loaderKey = (report.mod_loader || "").toLowerCase();
    const matchedKey = Object.keys(LOADER_IMG_MAP).find((k) => loaderKey.includes(k));
    const loaderSrc = matchedKey ? LOADER_IMG_MAP[matchedKey] : "/minecraft.png";

    const loaderImg = new Image();
    loaderImg.crossOrigin = "anonymous";
    loaderImg.src = loaderSrc;
    await new Promise<void>((resolve) => {
      if (loaderImg.complete) {
        resolve();
      } else {
        loaderImg.onload = () => resolve();
        loaderImg.onerror = () => resolve();
      }
    });

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#080a0f");
    bgGradient.addColorStop(1, "#111622");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Inter, sans-serif";
    ctx.fillText("TraceRoot", 60, 78);

    const loaderText = (report.mod_loader || "MOD").toUpperCase();
    ctx.font = "bold 16px Inter, sans-serif";
    const textWidth = ctx.measureText(loaderText).width;
    const badgeWidth = textWidth + 56;
    const badgeX = width - 60 - badgeWidth;
    const badgeY = 48;

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, 38, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.stroke();

    if (loaderImg.complete && loaderImg.naturalWidth > 0) {
      ctx.drawImage(loaderImg, badgeX + 10, badgeY + 7, 24, 24);
    }

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText(loaderText, badgeX + 40, badgeY + 24);

    let verdictBg = "rgba(16, 185, 129, 0.12)";
    let verdictBorder = "#10b981";
    let verdictColor = "#34d399";
    let verdictSub = "No known malicious patterns detected in static analysis";

    if (verdict === "suspicious") {
      verdictBg = "rgba(245, 158, 11, 0.12)";
      verdictBorder = "#f59e0b";
      verdictColor = "#fbbf24";
      verdictSub = "Unusual patterns flagged for closer review before installing";
    } else if (verdict === "malicious") {
      verdictBg = "rgba(239, 68, 68, 0.12)";
      verdictBorder = "#ef4444";
      verdictColor = "#f87171";
      verdictSub = "High-risk patterns detected, do not install this file";
    }

    ctx.fillStyle = verdictBg;
    ctx.beginPath();
    ctx.roundRect(60, 116, width - 120, 140, 16);
    ctx.fill();
    ctx.strokeStyle = verdictBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = verdictColor;
    ctx.font = "bold 44px Inter, sans-serif";
    ctx.fillText(verdictLabel(verdict).toUpperCase(), 95, 180);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "16px Inter, sans-serif";
    ctx.fillText(verdictSub, 95, 220);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText("RISK SCORE", width - 240, 160);

    ctx.fillStyle = verdictColor;
    ctx.font = "bold 44px Inter, sans-serif";
    ctx.fillText(`${report.risk_score}`, width - 240, 210);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "18px Inter, sans-serif";
    ctx.fillText("/ 100", width - 170, 210);

    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.roundRect(60, 280, width - 120, 240, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("FILE NAME", 90, 318);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'IBM Plex Mono', monospace";
    const truncatedName =
      report.file_name.length > 45 ? `${report.file_name.slice(0, 42)}...` : report.file_name;
    ctx.fillText(truncatedName, 90, 350);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("SHA-256", 90, 395);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "14px 'IBM Plex Mono', monospace";
    ctx.fillText(report.sha256, 90, 420);

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect(90, 445, width - 180, 55, 10);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "500 14px Inter, sans-serif";
    const findingsCount = report.findings?.length || 0;
    const rulesText = `Bytecode Heuristics: ${findingsCount === 0 ? "Clean (0 triggers)" : `${findingsCount} flagged`}`;
    ctx.fillText(rulesText, 110, 478);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText("•", 370, 478);

    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`Size: ${formatSize(report.file_size_bytes)}`, 390, 478);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText("•", 530, 478);

    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`Scanned: ${new Date().toISOString().split("T")[0]}`, 550, 478);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("Static analysis verification. Full report at traceroot.xyz", 60, 565);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText(reportUrl, width - 60 - ctx.measureText(reportUrl).width, 565);

    return canvas;
  }, [report, verdict, reportUrl]);

  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await drawCardToCanvas();
      if (!canvas) return;

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `traceroot-${report.sha256.slice(0, 12)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate card image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await drawCardToCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopiedKey("image");
          setTimeout(() => setCopiedKey(null), 2500);
        } catch {
          handleDownloadImage();
        }
      }, "image/png");
    } catch (err) {
      console.error("Failed to copy image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  const verdictMeta = {
    safe: {
      label: "Safe",
      sub: "No known malicious patterns in static analysis",
      icon: <ShieldCheck className="h-8 w-8 text-emerald-400" />,
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      wrap: "border-emerald-500/30 bg-emerald-500/10",
      text: "text-emerald-400",
    },
    suspicious: {
      label: "Suspicious",
      sub: "Signals that deserve a closer look before installing",
      icon: <AlertTriangle className="h-8 w-8 text-amber-400" />,
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      wrap: "border-amber-500/30 bg-amber-500/10",
      text: "text-amber-400",
    },
    malicious: {
      label: "Malicious",
      sub: "High-risk patterns detected, do not install this file",
      icon: <ShieldAlert className="h-8 w-8 text-red-400" />,
      badge: "bg-red-500/20 text-red-300 border-red-500/40",
      wrap: "border-red-500/30 bg-red-500/10",
      text: "text-red-400",
    },
  }[verdict];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[#0d1017] shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
                <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

                <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-dim)] text-[var(--accent)]">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Share Scan Report</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Share scan findings or export a report card image
            </p>
          </div>
        </div>

                <div className="mb-6 rounded-xl border border-[var(--border)] bg-[#080a0e] p-5 shadow-inner space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-faint)] border-b border-[var(--border-soft)] pb-3">
            <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Report Card Preview
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono uppercase text-[11px] font-semibold text-[var(--text)]">
              <ModLoaderIcon name={report.mod_loader} className="h-4 w-4" />
              {report.mod_loader}
            </span>
          </div>

                    <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${verdictMeta.wrap}`}>
            <div className="flex items-center gap-3">
              {verdictMeta.icon}
              <div>
                <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${verdictMeta.badge}`}>
                  {verdictMeta.label}
                </span>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{verdictMeta.sub}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Risk Score</div>
              <div className={`text-xl font-extrabold ${verdictMeta.text}`}>
                {report.risk_score} <span className="text-xs font-normal text-[var(--text-faint)]">/ 100</span>
              </div>
            </div>
          </div>

                    <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-faint)]">File:</span>
              <span className="font-mono font-medium text-[var(--text)] truncate max-w-[300px]">
                {report.file_name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-faint)]">SHA-256:</span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {report.sha256.slice(0, 16)}...{report.sha256.slice(-8)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-faint)]">Findings:</span>
              <span className="font-medium text-[var(--text)]">
                {report.findings?.length === 0
                  ? "Clean (0 malicious patterns)"
                  : `${report.findings?.length} security signatures matched`}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-soft)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span>traceroot.xyz</span>
            <span>Static analysis verification</span>
          </div>
        </div>

                <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Export &amp; Share Options
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
            >
              <Download className="h-4 w-4" />
              {isGeneratingImage ? "Rendering PNG..." : "Download Report Image (.png)"}
            </button>

                        <button
              onClick={handleCopyImageToClipboard}
              disabled={isGeneratingImage}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-white transition-all cursor-pointer"
            >
              {copiedKey === "image" ? <Check className="h-4 w-4 text-emerald-400" /> : <ImageIcon className="h-4 w-4" />}
              {copiedKey === "image" ? "Image Copied!" : "Copy Card Image"}
            </button>
          </div>

                    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-2">
            <input
              type="text"
              readOnly
              value={reportUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-[var(--text-muted)] focus:outline-none select-all"
            />
            <button
              onClick={() => copyToClipboard(reportUrl, "link")}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)] transition-all cursor-pointer shrink-0"
            >
              {copiedKey === "link" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === "link" ? "Copied" : "Copy Link"}
            </button>
          </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `TraceRoot Scan: ${report.file_name} is ${verdictLabel(verdict).toUpperCase()} (${report.risk_score}/100 risk score). Full report:`
              )}&url=${encodeURIComponent(reportUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
            >
              <svg className="h-3.5 w-3.5 text-zinc-300 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post to X
            </a>

                        <a
              href={`https://www.virustotal.com/gui/file/${report.sha256}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[var(--accent)]" />
              VirusTotal Hash
            </a>
          </div>
        </div>

                <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

