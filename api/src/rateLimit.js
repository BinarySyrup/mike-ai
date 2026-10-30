const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const attemptsByClient = new Map();

function getClientKey(request) {
  // Azure Static Web Apps forwards the client address in X-Forwarded-For.
  // This in-memory limiter is a local safeguard; production edge throttling is
  // still recommended because Functions may run on multiple instances.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientAddress = forwardedFor?.split(",")[0]?.trim();
  return clientAddress || "unknown";
}

function allowLoginAttempt(request, now = Date.now()) {
  const clientKey = getClientKey(request);
  const entry = attemptsByClient.get(clientKey);
  if (!entry || now - entry.windowStartedAt >= ATTEMPT_WINDOW_MS) {
    attemptsByClient.set(clientKey, { count: 1, windowStartedAt: now });
    pruneExpiredEntries(now, clientKey);
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

function pruneExpiredEntries(now, currentKey) {
  if (attemptsByClient.size < 1000) return;
  for (const [key, entry] of attemptsByClient) {
    if (key !== currentKey && now - entry.windowStartedAt >= ATTEMPT_WINDOW_MS) {
      attemptsByClient.delete(key);
    }
  }
}

module.exports = { allowLoginAttempt };
