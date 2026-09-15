export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  category: string;
  /** Root-relative path to the card/hero image, e.g. "/blog/images/how-to-tell.jpg" */
  image: string;
  imageAlt: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-tell-if-a-minecraft-mod-has-malware",
    title: "How to tell if a game mod has malware",
    description:
      "A friend sends you a mod file in Discord. Before it goes in your mods folder, here's what to actually check — hashes, file origin, and the red flags that matter.",
    date: "2026-08-31",
    readMinutes: 3,
    category: "Safety Guide",
    image: "/blog/images/how-to-tell.jpg",
    imageAlt: "A Discord chat window showing a mod file attachment being shared",
  },
  {
    slug: "common-minecraft-mod-malware-techniques",
    title: "Common Minecraft mod malware techniques",
    description:
      "Token stealers, hidden class loaders, and the Fractureiser incident — how malicious jars actually work under the hood in Fabric and Forge.",
    date: "2026-08-31",
    readMinutes: 3,
    category: "Threat Analysis",
    image: "/blog/images/malware-techniques.jpg",
    imageAlt: "Decompiled Java bytecode shown in an IDE with obfuscated method names",
  },
  {
    slug: "how-traceroot-scans-mods",
    title: "How TraceRoot scans mods",
    description:
      "We never run the mod. Here's exactly what our scanner reads inside a file across all games, how the risk score works, and where static analysis hits its limits.",
    date: "2026-08-31",
    readMinutes: 2,
    category: "Methodology",
    image: "/blog/images/how-we-scan.jpg",
    imageAlt: "A TraceRoot scan report showing a risk score and list of findings",
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}