import { GithubBanner } from "./GithubBanner";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { Analytics } from "./Analytics";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Analytics />
      <GithubBanner />
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
