let initializedMeasurementId: string | null = null;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: Gtag;
  }
}

function isValidMeasurementId(measurementId: string): boolean {
  return /^G-[A-Z0-9]+$/.test(measurementId);
}

function getGtag(): Gtag {
  window.dataLayer ??= [];
  const gtag = window.gtag ?? ((...args: unknown[]) => {
    window.dataLayer?.push(args);
  });
  window.gtag = gtag;
  return gtag;
}

export function initializeGoogleAnalytics(measurementId: string): void {
  if (!isValidMeasurementId(measurementId)) return;
  if (initializedMeasurementId === measurementId) return;

  const gtag = getGtag();
  initializedMeasurementId = measurementId;
  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: `${window.location.origin}/`,
    page_path: "/",
    page_title: "MikeAI Chat",
  });

  gtag("event", "page_view", {
    page_location: `${window.location.origin}/`,
    page_path: "/",
    page_title: "MikeAI Chat",
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}
