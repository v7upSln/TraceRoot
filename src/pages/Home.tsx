import { Dropzone } from "../components/Dropzone";
import { Steps } from "../components/Steps";
import { Trust } from "../components/Trust";
import { ToggleWord } from "../components/ToggleWord";
import { Seo } from "../components/Seo";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_URL } from "../lib/seo";
import { Link } from "react-router-dom";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TraceRoot",
    url: SITE_URL,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    description: DEFAULT_DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is this mod safe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "TraceRoot inspects the mod file without running it. A Safe verdict means no known threat patterns were found. We always recommend getting mods from trusted creators and official platforms.",
        },
      },
      {
        "@type": "Question",
        name: "Can a game mod steal Discord tokens?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Malicious mods can attempt to read saved tokens, browser passwords, or execute remote payloads. TraceRoot scans for webhooks, credential paths, and remote class loaders in the code.",
        },
      },
    ],
  },
];

export function Home() {
  return (
    <>
      <Seo title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} path="/" jsonLd={jsonLd} />
      <section className="px-6 pb-12 pt-10 sm:px-10 sm:pt-14">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-2 text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
            <span>Is this mod</span>
            <ToggleWord />
            <span>?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
            Free malware scanner for game mods &amp; plugins across all games. Drop any mod file to check for Discord token stealers, RATs, and hidden class loaders before putting it in your mods folder.
          </p>
        </div>

        <div className="mt-10">
          <Dropzone />
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-[var(--text-faint)]">
          Wondering if a file is safe before it hits your mods folder? Read{" "}
          <Link to="/blog/how-to-tell-if-a-minecraft-mod-has-malware" className="text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]">
            how to tell if a game mod has malware
          </Link>
          , or{" "}
          <Link to="/blog/how-traceroot-scans-mods" className="text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]">
            how TraceRoot scans mods
          </Link>
          .
        </p>
      </section>

      <Steps />
      <Trust />
    </>
  );
}
