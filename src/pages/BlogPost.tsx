import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "../components/Seo";
import { getPost } from "../content/blog";
import { HowToTell } from "../content/posts/HowToTell";
import { MalwareTechniques } from "../content/posts/MalwareTechniques";
import { HowWeScan } from "../content/posts/HowWeScan";

const BODIES: Record<string, () => ReactNode> = {
  "how-to-tell-if-a-minecraft-mod-has-malware": HowToTell,
  "common-minecraft-mod-malware-techniques": MalwareTechniques,
  "how-traceroot-scans-mods": HowWeScan,
};

const FAQS: Record<string, { q: string; a: string }[]> = {
  "how-to-tell-if-a-minecraft-mod-has-malware": [
    {
      q: "Is it safe to open a .jar file to look inside it?",
      a: "Yes — a jar is just a zip file. Renaming it to .zip and browsing the contents, or running it through a static scanner, doesn't execute any code.",
    },
    {
      q: "Can antivirus catch Minecraft mod malware?",
      a: "Sometimes, but mod-specific stealers are often too new or too niche to be in general antivirus signature databases. A scanner built around Fabric/Forge jars catches patterns generic AV tools miss.",
    },
    {
      q: "Is CurseForge or Modrinth completely safe?",
      a: "Safer than random links, but not immune — developer accounts have been compromised before. Provenance lowers risk, it doesn't remove it.",
    },
  ],
  "common-minecraft-mod-malware-techniques": [
    {
      q: "What is a Discord token stealer mod?",
      a: "A mod that reads Discord's locally cached login data and sends it to an attacker, letting them log into your Discord account without your password.",
    },
    {
      q: "Was Fractureiser a Fabric or Forge problem?",
      a: "Both. It spread through compromised developer accounts on CurseForge and Modrinth, affecting mods across both loaders.",
    },
    {
      q: "Does obfuscated code always mean a mod is malicious?",
      a: "No. Some legitimate mods obfuscate to protect commercial code. It's a signal worth combining with others, not a verdict on its own.",
    },
  ],
};

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;
  const Body = slug ? BODIES[slug] : undefined;
  const faq = slug ? FAQS[slug] : undefined;

  if (!post || !Body) {
    return <Navigate to="/blog" replace />;
  }

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      image: `https://traceroot.xyz${post.image}`,
      author: { "@type": "Organization", name: "TraceRoot" },
    },
  ];

  if (faq) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <article className="px-6 py-12 sm:px-10">
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
        image={post.image}
        jsonLd={jsonLd}
      />
      <div className="mx-auto max-w-2xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-faint)] transition-colors hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All guides
        </Link>
        <p className="mt-6 text-[11px] text-[var(--text-faint)]">
          {post.date} · {post.readMinutes} min read
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">{post.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-body)]">{post.description}</p>
        <div className="blog-prose mt-10 space-y-5 text-sm leading-relaxed">
          <Body />
        </div>
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">Check a jar yourself</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Upload a Minecraft mod or paste a Modrinth link. We inspect the bytecode without running the file.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Open the scanner
          </Link>
        </div>
      </div>
    </article>
  );
}