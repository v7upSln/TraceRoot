import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const BASE_URL = "https://traceroot.xyz";
const API_BASE_URL = process.env.VITE_API_URL || "https://traceroot-be.onrender.com";

if (!fs.existsSync(DIST_DIR)) {
  console.error("[-] dist/ directory does not exist. Run 'vite build' first.");
  process.exit(1);
}

const templatePath = path.join(DIST_DIR, "index.html");
const template = fs.readFileSync(templatePath, "utf-8");

// Blog posts metadata
const BLOG_POSTS = [
  {
    slug: "how-to-tell-if-a-minecraft-mod-has-malware",
    title: "How to tell if a game mod has malware — TraceRoot",
    description: "A friend sends you a mod file in Discord. Before it goes in your mods folder, here's what to check — hashes, file origin, and red flags.",
    category: "Safety Guide",
    date: "2026-08-31",
  },
  {
    slug: "common-minecraft-mod-malware-techniques",
    title: "Common Minecraft mod malware techniques — TraceRoot",
    description: "Token stealers, hidden class loaders, and Fractureiser — how malicious jars work under the hood in Fabric and Forge.",
    category: "Threat Analysis",
    date: "2026-08-31",
  },
  {
    slug: "how-traceroot-scans-mods",
    title: "How TraceRoot scans mods — TraceRoot",
    description: "We never run the mod. Here's exactly what our scanner reads inside a file, how the risk score works, and limits of static analysis.",
    category: "Methodology",
    date: "2026-08-31",
  }
];

async function loadIndexedMods() {
  let mods = [];
  const cachePath = path.resolve(ROOT_DIR, "../reports_cache/_mods_index.json");
  if (fs.existsSync(cachePath)) {
    try {
      const rawCache = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      mods = Object.values(rawCache);
      console.log(`[*] Loaded ${mods.length} indexed mods from disk cache.`);
      return mods;
    } catch (err) {
      console.warn(`[!] Failed to parse disk cache: ${err.message}`);
    }
  }

  // Fallback to API if disk cache is missing (e.g. during CI / Cloudflare build)
  try {
    console.log(`[*] Fetching mod catalog from API (${API_BASE_URL}/api/mods)...`);
    const res = await fetch(`${API_BASE_URL}/api/mods`);
    if (res.ok) {
      const data = await res.json();
      mods = data.mods || [];
      console.log(`[*] Fetched ${mods.length} indexed mods from API.`);
    } else {
      console.warn(`[!] API returned status ${res.status}`);
    }
  } catch (err) {
    console.warn(`[!] Failed to fetch mod catalog from API: ${err.message}`);
  }

  return mods;
}

async function loadReportIndex() {
  try {
    console.log(`[*] Fetching report index from API (${API_BASE_URL}/api/reports/index)...`);
    // Generous timeout: the backend may be cold-starting.
    const res = await fetch(`${API_BASE_URL}/api/reports/index?limit=500`, {
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      console.warn(`[!] Report index returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    const reports = (data.reports || []).filter((r) => /^[a-f0-9]{64}$/.test(r.sha256 || ""));
    console.log(`[*] Fetched ${reports.length} scan reports from API.`);
    return reports;
  } catch (err) {
    console.warn(`[!] Failed to fetch report index: ${err.message}`);
    return [];
  }
}

function verdictText(report) {
  const v = String(report.verdict || "").toUpperCase();
  const score = Number(report.risk_score) || 0;
  if (score === 0 || v === "CLEAN" || v === "SAFE") return "Safe";
  if (v === "MALICIOUS" || v === "CRITICAL" || v === "HIGH" || score >= 40) return "Malicious";
  return "Suspicious";
}

function buildSitemapXml(staticPaths, mods, reports) {
  const entry = (loc, freq, prio, lastmod) =>
    `  <url><loc>${escapeXml(BASE_URL + loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;
  const lines = staticPaths.map((p) => entry(p.path, p.freq, p.prio));
  for (const m of mods) {
    if (m.slug) lines.push(entry(`/mods/${m.slug}/`, "weekly", "0.8", (m.updated_at || "").slice(0, 10)));
  }
  for (const r of reports) {
    lines.push(entry(`/report/${r.sha256}/`, "monthly", "0.5", (r.scanned_at || "").slice(0, 10)));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;
}

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function injectHeadAndBody(htmlTemplate, route) {
  const routePath = route.path === "/" ? "/" : route.path.endsWith("/") ? route.path : `${route.path}/`;
  const canonicalUrl = `${BASE_URL}${routePath}`;
  
  let html = htmlTemplate;

  // Replace <title>
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeXml(route.title)}</title>`);

  // Strip template default meta tags to prevent duplicates
  html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/>/s, "");
  html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/>/s, "");
  html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/>/s, "");
  html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/>/s, "");
  html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/>/s, "");
  html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/>/s, "");

  // Build meta tags to inject into <head>
  const metaHead = `
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="description" content="${escapeXml(route.description)}" />
    <meta property="og:title" content="${escapeXml(route.title)}" />
    <meta property="og:description" content="${escapeXml(route.description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${escapeXml(route.title)}" />
    <meta name="twitter:description" content="${escapeXml(route.description)}" />
  `;

  // Insert head metadata right before </head>
  html = html.replace("</head>", `${metaHead}\n  </head>`);

  // Insert static pre-rendered HTML inside <div id="root"></div> for crawlers
  if (route.bodyHtml) {
    html = html.replace('<div id="root"></div>', `<div id="root">${route.bodyHtml}</div>`);
  }

  return html;
}

async function main() {
  const indexedMods = await loadIndexedMods();
  const reportIndex = await loadReportIndex();

  const routes = [
    {
      path: "/",
      title: "TraceRoot — Free Minecraft Mod Malware & Virus Scanner (.jar)",
      description: "Scan Minecraft mods & plugins (.jar) for token stealers, RATs, Fractureiser, and hidden malware before installing. Free static bytecode analysis.",
      bodyHtml: `
        <main style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
          <h1>TraceRoot — Free Minecraft Mod Malware & Virus Scanner (.jar)</h1>
          <p>Scan Minecraft mods & plugins (.jar) for token stealers, RATs, Fractureiser, and hidden malware before installing. Free static bytecode analysis for Fabric, Forge, NeoForge, & Bukkit.</p>
          <section>
            <h2>Why Scan Minecraft Mods?</h2>
            <p>Malicious Minecraft mods can steal your Discord tokens, session tokens, browser passwords, or install Remote Access Trojans (RATs). TraceRoot performs static bytecode decompilation and YARA rule scans to detect malware signatures instantly.</p>
          </section>
        </main>
      `
    },
    {
      path: "/mods",
      title: "Popular Mods Security Directory | TraceRoot",
      description: "Browse security audit reports and verified SHA-256 hashes for popular Minecraft mods. Verify mod safety before installation.",
      bodyHtml: `
        <main style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
          <h1>Minecraft Mod Safety Catalog & Directory</h1>
          <p>Browse security audit reports and verified SHA-256 hashes for popular Minecraft mods including Fabric API, Sodium, Iris, Lithium, and more.</p>
        </main>
      `
    },
    {
      path: "/blog",
      title: "Guides & Security Research — TraceRoot",
      description: "Practical writeups on mod safety, understanding suspicious bytecode, and how TraceRoot's static analysis works.",
      bodyHtml: `
        <main style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
          <h1>Guides & Security Research</h1>
          <p>Practical writeups on mod safety, understanding suspicious bytecode, and how TraceRoot's static analysis works.</p>
          <ul>
            ${BLOG_POSTS.map(p => `<li><a href="/blog/${p.slug}">${p.title}</a> - ${p.description}</li>`).join("\n")}
          </ul>
        </main>
      `
    },
    {
      path: "/privacy",
      title: "Privacy Policy — TraceRoot",
      description: "How TraceRoot handles uploads, scan reports, and analytics.",
      bodyHtml: `
        <main style="max-width: 800px; margin: 0 auto; padding: 2rem;">
          <h1>Privacy Policy</h1>
          <p>You can scan without an account. Uploaded jars are analyzed on the server and deleted from disk after the scan. We store JSON reports keyed by file hashes (SHA-256, SHA-1, MD5).</p>
        </main>
      `
    }
  ];

  // Add blog posts to routes
  for (const post of BLOG_POSTS) {
    routes.push({
      path: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      bodyHtml: `
        <article style="max-width: 800px; margin: 0 auto; padding: 2rem;">
          <nav><a href="/blog">&larr; Back to Guides</a></nav>
          <h1>${post.title}</h1>
          <p><strong>Published: ${post.date} | Category: ${post.category}</strong></p>
          <p>${post.description}</p>
        </article>
      `
    });
  }

  // Add mod catalog entries to routes
  for (const mod of indexedMods) {
    if (!mod.slug) continue;
    const modTitle = `Is ${mod.name} Safe? Security Scan Report | TraceRoot`; // escaped by injectHeadAndBody
    const safeName = escapeXml(mod.name);
    const modDesc = `TraceRoot safety audit report for ${mod.name} v${mod.latest_version || "latest"}. Verdict: ${mod.verdict} (Risk Score: ${mod.risk_score}/100). Verified SHA-256: ${mod.sha256 || "N/A"}.`;
    
    routes.push({
      path: `/mods/${mod.slug}`,
      title: modTitle,
      description: modDesc,
      bodyHtml: `
        <main style="max-width: 1000px; margin: 0 auto; padding: 2rem;">
          <nav><a href="/mods">&larr; Mod Catalog</a> / <span>${safeName}</span></nav>
          <h1>Is ${safeName} Safe? Security Audit Report</h1>
          <p><strong>Safety Verdict:</strong> ${escapeXml(mod.verdict)} | <strong>Risk Score:</strong> ${mod.risk_score}/100</p>
          <p>${escapeXml(mod.summary || "")}</p>
          <p><strong>Latest Version:</strong> ${escapeXml(mod.latest_version || "N/A")}</p>
          <p><strong>SHA-256 Hash:</strong> <code>${escapeXml(mod.sha256 || "N/A")}</code></p>
        </main>
      `
    });
  }

  // Add one pre-rendered page per scanned file so crawlers get real content without running JS
  for (const report of reportIndex) {
    const name = report.file_name || `${report.sha256.slice(0, 8)}.jar`;
    const verdict = verdictText(report);
    const score = Number(report.risk_score) || 0;
    const loader = report.mod_loader && report.mod_loader !== "unknown" ? ` (${report.mod_loader})` : "";
    routes.push({
      path: `/report/${report.sha256}`,
      title: `Is ${name} safe? ${verdict} — TraceRoot Scan Report`,
      description: `TraceRoot static analysis of ${name}${loader}: verdict ${verdict}, risk score ${score}/100. SHA-256 ${report.sha256.slice(0, 16)}\u2026 Review findings, file hashes and scan details.`,
      bodyHtml: `
        <main style="max-width: 1000px; margin: 0 auto; padding: 2rem;">
          <nav><a href="/">&larr; TraceRoot scanner</a></nav>
          <h1>Is ${escapeXml(name)} safe? Scan report</h1>
          <p><strong>Verdict:</strong> ${verdict} | <strong>Risk Score:</strong> ${score}/100</p>
          <p><strong>SHA-256:</strong> <code>${escapeXml(report.sha256)}</code></p>
          ${report.scanned_at ? `<p><strong>Last scanned:</strong> ${escapeXml(String(report.scanned_at).slice(0, 10))}</p>` : ""}
        </main>
      `
    });
  }

  // Static sitemap (fallback for the Worker, which serves the backend's dynamic version when reachable)
  const staticPaths = [
    { path: "/", freq: "daily", prio: "1.0" },
    { path: "/mods/", freq: "daily", prio: "0.9" },
    { path: "/blog/", freq: "weekly", prio: "0.8" },
    ...BLOG_POSTS.map((p) => ({ path: `/blog/${p.slug}/`, freq: "monthly", prio: "0.9" })),
    { path: "/privacy/", freq: "yearly", prio: "0.3" },
  ];
  fs.writeFileSync(
    path.join(DIST_DIR, "sitemap.xml"),
    buildSitemapXml(staticPaths, indexedMods, reportIndex),
    "utf-8"
  );
  console.log(`[+] Wrote dist/sitemap.xml (${staticPaths.length} pages, ${indexedMods.length} mods, ${reportIndex.length} reports)`);

  let renderedCount = 0;
  for (const route of routes) {
    const routeHtml = injectHeadAndBody(template, route);
    
    let targetFile;
    if (route.path === "/") {
      targetFile = path.join(DIST_DIR, "index.html");
    } else {
      const routeDir = path.join(DIST_DIR, route.path.replace(/^\//, ""));
      fs.mkdirSync(routeDir, { recursive: true });
      targetFile = path.join(routeDir, "index.html");
    }

    fs.writeFileSync(targetFile, routeHtml, "utf-8");
    renderedCount++;
  }

  console.log(`[+] Successfully pre-rendered ${renderedCount} static routes to dist/`);
}

main().catch((err) => {
  console.error(`[-] Pre-rendering failed: ${err.stack || err}`);
  process.exit(1);
});
