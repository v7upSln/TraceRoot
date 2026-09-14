import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Seo } from "../components/Seo";
import { POSTS } from "../content/blog";

export function BlogIndex() {
  return (
    <div className="px-6 py-12 sm:px-10 max-w-4xl mx-auto">
      <Seo
        title="Guides & Research"
        description="Practical guides on spotting malicious Minecraft mods, how token-stealer jars work, and how TraceRoot's static analysis actually scans a file."
        path="/blog"
        type="article"
      />
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)] mb-3">
          <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Research &amp; Guides</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          Guides &amp; Research
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-body)]">
          Practical writeups on mod safety, understanding suspicious bytecode, and how our static analysis works.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-150 hover:border-[var(--accent)] hover:shadow-md hover:bg-[var(--bg-surface-raised)]"
          >
            <img
              src={post.image}
              alt={post.imageAlt}
              loading="lazy"
              className="h-40 w-full object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-2.5">
                <span className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-base)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                  {post.category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readMinutes} min read</span>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {post.description}
              </p>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                <span>Read guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}