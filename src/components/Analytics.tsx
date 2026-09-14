import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GA_MEASUREMENT_ID } from "../lib/seo";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const page_path = `${location.pathname}${location.search}`;
    window.gtag("config", GA_MEASUREMENT_ID, { page_path, anonymize_ip: true });
  }, [location.pathname, location.search]);

  return null;
}
