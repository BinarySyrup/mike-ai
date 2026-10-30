const crypto = require("node:crypto");

const COOKIE_NAME = "mikeai_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const SESSION_SECRET_MIN_BYTES = 32;

class AuthConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

function getAccessCodes() {
  const raw = process.env.ACCESS_CODES;
  if (!raw) {
    throw new AuthConfigurationError("ACCESS_CODES is not configured.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AuthConfigurationError("ACCESS_CODES must be a JSON array.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((code) => typeof code !== "string" || code.length === 0)) {
    throw new AuthConfigurationError("ACCESS_CODES must contain one or more non-empty strings.");
  }

  return parsed;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < SESSION_SECRET_MIN_BYTES) {
    throw new AuthConfigurationError("SESSION_SECRET must be at least 32 bytes.");
  }
  return secret;
}

function safeEqual(left, right) {
  const leftDigest = crypto.createHash("sha256").update(left, "utf8").digest();
  const rightDigest = crypto.createHash("sha256").update(right, "utf8").digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

function isValidAccessCode(submittedCode, accessCodes) {
  let matched = false;
  for (const accessCode of accessCodes) {
    matched = safeEqual(submittedCode, accessCode) || matched;
  }
  return matched;
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionCookie() {
  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    version: 1,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString("base64url"),
  })).toString("base64url");
  const token = `${payload}.${sign(payload, secret)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secureCookieFlag()}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureCookieFlag()}`;
}

function secureCookieFlag() {
  return process.env.NODE_ENV === "development" ? "" : "; Secure";
}

function getCookieValue(request, cookieName) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === cookieName) {
      return part.slice(separator + 1).trim();
    }
  }
  return undefined;
}

function getValidSession(request) {
  const token = getCookieValue(request, COOKIE_NAME);
  if (!token) return null;

  let secret;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let signatureBytes;
  let expectedBytes;
  try {
    signatureBytes = Buffer.from(signature, "base64url");
    expectedBytes = Buffer.from(sign(payload, secret), "base64url");
  } catch {
    return null;
  }
  if (signatureBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(signatureBytes, expectedBytes)) {
    return null;
  }

  let session;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!session || typeof session !== "object") return null;
  const now = Math.floor(Date.now() / 1000);
  const valid = session.version === 1
    && Number.isInteger(session.issuedAt)
    && Number.isInteger(session.expiresAt)
    && typeof session.nonce === "string"
    && session.issuedAt <= now
    && session.expiresAt > now
    && session.expiresAt - session.issuedAt <= SESSION_TTL_SECONDS;
  return valid ? session : null;
}

function hasValidSession(request) {
  return getValidSession(request) !== null;
}

function createConversationHandle(conversationId, session) {
  const payload = Buffer.from(JSON.stringify({ conversationId })).toString("base64url");
  const signature = sign(`${session.nonce}.${payload}`, getSessionSecret());
  return `${payload}.${signature}`;
}

function resolveConversationHandle(handle, session) {
  if (typeof handle !== "string") return undefined;
  const separator = handle.lastIndexOf(".");
  if (separator <= 0) return undefined;

  const payload = handle.slice(0, separator);
  const signature = handle.slice(separator + 1);
  const expectedBytes = Buffer.from(sign(`${session.nonce}.${payload}`, getSessionSecret()), "base64url");
  const signatureBytes = Buffer.from(signature, "base64url");
  if (signatureBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(signatureBytes, expectedBytes)) {
    return undefined;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof decoded.conversationId === "string" && decoded.conversationId.length <= 256
      ? decoded.conversationId
      : undefined;
  } catch {
    return undefined;
  }
}

module.exports = {
  AuthConfigurationError,
  createSessionCookie,
  clearSessionCookie,
  getAccessCodes,
  getSessionSecret,
  getValidSession,
  isValidAccessCode,
  createConversationHandle,
  resolveConversationHandle,
  hasValidSession,
};
