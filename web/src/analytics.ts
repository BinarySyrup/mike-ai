const initializedMeasurementIds = new Set<string>();
let activeMeasurementId: string | null = null;

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

export function enableGoogleAnalytics(measurementId: string): void {
  if (!isValidMeasurementId(measurementId)) return;

  const disabledFlag = `ga-disable-${measurementId}`;
  Reflect.set(window, disabledFlag, false);

  const gtag = getGtag();
  if (!initializedMeasurementIds.has(measurementId)) {
    initializedMeasurementIds.add(measurementId);
    gtag("js", new Date());
    gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${window.location.origin}/`,
      page_path: "/",
      page_title: "MikeAI Chat",
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  if (activeMeasurementId !== measurementId) {
    gtag("event", "page_view", {
      page_location: `${window.location.origin}/`,
      page_path: "/",
      page_title: "MikeAI Chat",
    });
    activeMeasurementId = measurementId;
  }
}

export function disableGoogleAnalytics(measurementId: string): void {
  if (!isValidMeasurementId(measurementId)) return;

  const disabledFlag = `ga-disable-${measurementId}`;
  Reflect.set(window, disabledFlag, true);
  if (activeMeasurementId === measurementId) activeMeasurementId = null;

  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=", 1)[0]?.trim();
    if (name === "_ga" || name === "_gid" || name?.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }
}
