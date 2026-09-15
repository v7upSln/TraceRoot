import { Seo } from "../components/Seo";

export function Privacy() {
  return (
    <div className="px-6 py-12 sm:px-10">
      <Seo
        title="Privacy"
        description="How TraceRoot handles uploads, hashes, and Google Analytics."
        path="/privacy"
      />
      <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed text-[var(--text-muted)]">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">Privacy</h1>
        <p>
          You can scan without an account. Uploaded jars are analyzed on the server and deleted from disk after
          the scan. We store a JSON report keyed by file hashes (SHA-256, SHA-1, MD5), filenames we have seen
          for that hash, and scan timestamps so repeat lookups do not require another upload.
        </p>
        <p>
          Do not upload files that contain secrets you cannot afford to have in a report (API keys inside a jar,
          private configs). Reports are retrievable by hash.
        </p>
        <p>
          We use Google Analytics to understand aggregate traffic. IP
          anonymization is enabled in the tag config. We do not use analytics to identify individual scan
          contents.
        </p>
        <p>
          URL scans only accept HTTPS Modrinth hosts. We do not fetch arbitrary websites on your behalf.
          
          later will be more support :)
        </p>
      </div>
    </div>
  );
}
