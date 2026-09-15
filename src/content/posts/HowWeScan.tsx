import { Link } from "react-router-dom";

export function HowWeScan() {
  return (
    <>
      <p>
        TraceRoot is a static scanner — we read the mod file, we don't run it. The game never launches, your code
        never gets executed, and the file never gets a network connection to actually use. That's both the
        safety guarantee and the limitation, and we'd rather just say that plainly than oversell it.
      </p>

      <figure>
        <img
          src="/blog/images/how-we-scan.jpg"
          alt="A TraceRoot scan report showing a risk score and list of findings"
          loading="lazy"
        />
        <figcaption>A finished report: verdict, risk score, and the specific things that triggered it.</figcaption>
      </figure>

      <h2>What we actually read</h2>
      <ul>
        <li>The archive structure itself — compression ratios, entropy, nested packages, with safeguards against malformed files that could stall the scanner.</li>
        <li>Package metadata and declarations — declared name, version, authors, and framework metadata.</li>
        <li>Constant pools, strings, and code references where URLs, IPs, Discord webhooks, shell commands, and reflective or native API calls tend to show up.</li>
        <li>Package layout and known libraries — telemetry SDKs, hooks, HTTP clients — flagged as transparency notes, not automatic red flags.</li>
      </ul>

      <h2>How the verdict gets calculated</h2>
      <p>
        Heuristic rules look for patterns tied to stealers, destructive file operations, remote code loading, and
        telemetry that was never disclosed. Every match becomes a finding with its own severity. Those findings
        roll up into a 0–100 risk score and a plain verdict: <strong>Safe</strong>, <strong>Suspicious</strong>, or{" "}
        <strong>Malicious</strong>. We also check extracted byte patterns against known malware signatures, so
        previously identified variants get flagged even without a heuristic match.
      </p>

      <h2>What "Safe" actually means</h2>
      <p>
        Static analysis is a genuinely useful first check, not a guarantee. A heavily obfuscated or encrypted
        payload can pass a static scan and still do something bad once it's actually running. The goal here isn't
        to replace your judgment, it's to give you a fast, clear, shareable starting point before you decide
        whether to install something you didn't write yourself.
      </p>
      <p>
        Want the pre-install checklist? Read{" "}
        <Link to="/blog/how-to-tell-if-a-minecraft-mod-has-malware">how to tell if a game mod has malware</Link>
        . Curious what these findings look like in practice?{" "}
        <Link to="/blog/common-minecraft-mod-malware-techniques">Common malware techniques</Link> walks through
        real examples.
      </p>
    </>
  );
}
