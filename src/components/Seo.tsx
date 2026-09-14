import { Helmet } from "react-helmet-async";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_URL } from "../lib/seo";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  type?: "website" | "article";
  image?: string;
  themeColor?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noindex = false,
  type = "website",
  image = `${SITE_URL}/og-default.png`,
  themeColor = "#10b981",
  jsonLd,
}: SeoProps) {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = title === DEFAULT_TITLE || title.includes("TraceRoot") ? title : title;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {themeColor && <meta name="theme-color" content={themeColor} />}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="TraceRoot" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

