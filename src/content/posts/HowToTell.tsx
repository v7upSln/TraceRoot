import { Link } from "react-router-dom";

export function HowToTell() {
  return (
    <>
      <p>
        Nobody actually googles "malware scanner" when this happens. It's usually a friend dropping a jar in
        Discord, or a random comment linking a "working 1.21 client" that doesn't exist on Modrinth. You've got a
        file, a few seconds of hesitation, and no easy way to tell if it's fine. Here's the order I'd actually go
        through before it touches a mods folder.
      </p>

      <figure>
        <img
          src="/blog/images/how-to-tell.jpg"
          alt="A Discord chat window showing a .jar file attachment being shared"
          loading="lazy"
        />
        <figcaption>Most sketchy mods don't arrive through a store page — they arrive through a chat.</figcaption>
      </figure>

      <h2>Where did the file actually come from?</h2>
      <p>
        Modrinth and CurseForge aren't bulletproof — the Fractureiser incident in 2023 proved that compromised
        developer accounts can push malicious updates through official channels too. But a project with real
        version history, a known author, and download numbers is still a much safer starting point than a jar
        someone attached in a DM.
      </p>
      <p>
        If someone only sends you the file, ask for the SHA-256 hash before you download anything. You can check
        a hash against TraceRoot or VirusTotal without ever running the file, and sharing a hash string is a lot
        safer than sharing the actual jar back and forth.
      </p>

      <h2>Small things that give it away</h2>
      <p>
        The filename usually tells on itself first. Watch for anything that doesn't match the mod you searched
        for, or has extra words tacked on — "cracked," "premium," "free cape," that kind of thing. Same goes for
        files attached directly in Discord or Telegram instead of linked from an actual version page, project
        pages that are brand new with almost no downloads but promise client-side cheats or cosmetics nobody else
        has, and — this one's a dead giveaway — an author telling you to disable your antivirus or "just allow the
        network prompt."
      </p>

      <h2>What a static scanner can and can't tell you</h2>
      <p>
        A tool like TraceRoot reads the jar without executing it — classes, manifest, strings, any URLs or
        webhooks baked into the bytecode. That's the whole point: nothing runs, so nothing can actually infect
        you during the scan. The tradeoff is that some malware only decrypts its real payload after launch, which
        static analysis can't see. A <strong>Safe</strong> verdict means "no known bad patterns found," not a
        guarantee.
      </p>
      <p>
        If a mod asks for permissions that don't make sense, ships a second jar nested inside it, or talks to a
        server that has nothing to do with Minecraft (paste sites, IP loggers, a raw Discord webhook URL), that's
        worth a second look even with a clean scan.
      </p>

      <h2>The short version</h2>
      <ol>
        <li>Check the project page, not just the filename.</li>
        <li>Grab the SHA-256 hash and keep it with the file.</li>
        <li>
          Run it through <Link to="/">TraceRoot</Link> and actually read the findings, not just the color badge.
        </li>
        <li>Anything mentioning Discord tokens, remote class loaders, or PowerShell — don't install it.</li>
      </ol>
      <p>
        Want to see what these techniques actually look like inside a jar? Read{" "}
        <Link to="/blog/common-minecraft-mod-malware-techniques">common Minecraft mod malware techniques</Link>.
        Curious what our scanner is doing under the hood?{" "}
        <Link to="/blog/how-traceroot-scans-mods">Here's how TraceRoot scans mods</Link>.
      </p>

      <h2>Quick questions</h2>
      <p>
        <strong>Is it safe to open a .jar file to look inside it?</strong>
        <br />
        Yes, a jar is just a zip file. Renaming it to .zip and browsing the contents, or running it through a
        static scanner, doesn't execute any code.
      </p>
      <p>
        <strong>Can antivirus catch Minecraft mod malware?</strong>
        <br />
        Sometimes, but mod-specific stealers are often too new or too niche to be in general antivirus signature
        databases. A scanner built around Fabric/Forge jars catches patterns that generic AV tools miss.
      </p>
      <p>
        <strong>Is CurseForge or Modrinth completely safe?</strong>
        <br />
        Safer than random links, but not immune — developer accounts have been compromised before. Provenance
        lowers risk, it doesn't remove it.
      </p>
    </>
  );
}