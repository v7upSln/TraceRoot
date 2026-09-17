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

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function injectHeadAndBody(htmlTemplate, route) {
  const canonicalUrl = `${BASE_URL}${route.path === "/" ? "/" : route.path}`;
  
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
      description: "How TraceRoot handles uploads, hashes, and Google Analytics.",
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
    const modTitle = `Is ${mod.name} Safe? Security Scan Report | TraceRoot`;
    const modDesc = `TraceRoot safety audit report for ${mod.name} v${mod.latest_version || "latest"}. Verdict: ${mod.verdict} (Risk Score: ${mod.risk_score}/100). Verified SHA-256: ${mod.sha256 || "N/A"}.`;
    
    routes.push({
      path: `/mods/${mod.slug}`,
      title: modTitle,
      description: modDesc,
      bodyHtml: `
        <main style="max-width: 1000px; margin: 0 auto; padding: 2rem;">
          <nav><a href="/mods">&larr; Mod Catalog</a> / <span>${mod.name}</span></nav>
          <h1>Is ${mod.name} Safe? Security Audit Report</h1>
          <p><strong>Safety Verdict:</strong> ${mod.verdict} | <strong>Risk Score:</strong> ${mod.risk_score}/100</p>
          <p>${mod.summary || ""}</p>
          <p><strong>Latest Version:</strong> ${mod.latest_version || "N/A"}</p>
          <p><strong>SHA-256 Hash:</strong> <code>${mod.sha256 || "N/A"}</code></p>
        </main>
      `
    });
  }

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
