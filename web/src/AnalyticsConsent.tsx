import { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { disableGoogleAnalytics, enableGoogleAnalytics } from "./analytics";

const CONSENT_STORAGE_KEY = "mikeai-analytics-consent";
type ConsentState = "loading" | "unknown" | "granted" | "denied";

export default function AnalyticsConsent() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";
  const [consent, setConsent] = useState<ConsentState>("loading");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let savedConsent: string | null = null;
    try {
      savedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      // If browser storage is unavailable, ask again on the next visit.
    }
    setConsent(savedConsent === "granted" || savedConsent === "denied" ? savedConsent : "unknown");
  }, []);

  useEffect(() => {
    if (!measurementId) return;
    if (consent === "granted") enableGoogleAnalytics(measurementId);
    if (consent === "denied") disableGoogleAnalytics(measurementId);
  }, [consent, measurementId]);

  if (!/^G-[A-Z0-9]+$/.test(measurementId) || consent === "loading") return null;

  function saveChoice(choice: "granted" | "denied") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Keep the current choice for this page even when browser storage is unavailable.
    }
    setConsent(choice);
    setEditing(false);
  }

  if (consent !== "unknown" && !editing) {
    return (
      <Box className="analytics-preferences-control">
        <Button size="small" onClick={() => setEditing(true)}>
          Privacy choices
        </Button>
      </Box>
    );
  }

  return (
    <Paper className="analytics-consent" elevation={8} role="region" aria-label="Analytics preferences">
      <Typography variant="subtitle2" fontWeight={700}>Help improve MikeAI</Typography>
      <Typography variant="body2" color="text.secondary">
        Allow Google Analytics to collect basic visit information. Chat messages and access codes are never sent to Google.
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
        <Button size="small" onClick={() => saveChoice("denied")}>Decline</Button>
        <Button size="small" variant="contained" onClick={() => saveChoice("granted")}>
          Allow analytics
        </Button>
      </Stack>
    </Paper>
  );
}
