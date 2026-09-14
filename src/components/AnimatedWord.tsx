const words = ["safe", "clean", "legit", "malware-free"];

export function AnimatedWord() {
  return (
    <span className="word-cycle relative inline-block h-[1.15em] w-[6.5ch] align-bottom text-[var(--accent)]">
      {words.map((word, i) => (
        <span key={word} style={{ animationDelay: `${i * 2}s` }}>
          {word}
        </span>
      ))}
    </span>
  );
}
