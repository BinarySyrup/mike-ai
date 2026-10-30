const { app } = require("@azure/functions");
const {
  AuthConfigurationError,
  clearSessionCookie,
  createSessionCookie,
  getAccessCodes,
  getSessionSecret,
  hasValidSession,
  isValidAccessCode,
} = require("../auth");
const { getRequestId, jsonResponse } = require("../http");
const { allowLoginAttempt } = require("../rateLimit");

const MAX_CODE_LENGTH = 256;

async function readLoginCode(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) return { error: "Request is too large." };

  let body;
  try {
    body = await request.json();
  } catch {
    return { error: "Request body must be valid JSON." };
  }

  return { code: body && typeof body.code === "string" ? body.code : undefined };
}

function logAuthenticationAttempt(context, requestId, outcome, submittedCode) {
  // The product requirement explicitly asks for the submitted shared code in auth logs.
  const fullCode = typeof submittedCode === "string" ? submittedCode : null;
  const loggedCode = fullCode === null ? null : fullCode.slice(0, MAX_CODE_LENGTH);
  context.log(JSON.stringify({
    event: "authentication_attempt",
    requestId,
    outcome,
    submittedCode: loggedCode,
    codeTruncated: fullCode !== null && fullCode.length > MAX_CODE_LENGTH,
  }));
}

async function authLogin(request, context) {
  const requestId = getRequestId(context);
  const { code, error } = await readLoginCode(request);

  if (error) {
    logAuthenticationAttempt(context, requestId, "invalid_request", null);
    return jsonResponse(400, { error, requestId });
  }

  if (typeof code !== "string" || code.length === 0 || code.length > MAX_CODE_LENGTH) {
    logAuthenticationAttempt(context, requestId, "invalid_code_format", code);
    return jsonResponse(400, { error: "Enter a valid access code.", requestId });
  }

  if (!allowLoginAttempt(request)) {
    logAuthenticationAttempt(context, requestId, "rate_limited", code);
    return jsonResponse(429, { error: "Too many attempts. Please try again later.", requestId }, { "Retry-After": "900" });
  }

  try {
    const accessCodes = getAccessCodes();
    getSessionSecret();

    if (!isValidAccessCode(code, accessCodes)) {
      logAuthenticationAttempt(context, requestId, "failure", code);
      return jsonResponse(401, { error: "That access code was not accepted.", requestId });
    }

    logAuthenticationAttempt(context, requestId, "success", code);
    return jsonResponse(200, { authenticated: true }, { "Set-Cookie": createSessionCookie() });
  } catch (configurationError) {
    if (configurationError instanceof AuthConfigurationError) {
      logAuthenticationAttempt(context, requestId, "configuration_error", code);
      context.error(JSON.stringify({ event: "authentication_configuration_error", requestId }));
      return jsonResponse(503, { error: "Sign-in is not configured. Please contact the app administrator.", requestId });
    }
    throw configurationError;
  }
}

async function authSession(request) {
  return hasValidSession(request)
    ? jsonResponse(200, { authenticated: true })
    : jsonResponse(401, { authenticated: false });
}

async function authLogout() {
  return jsonResponse(200, { authenticated: false }, { "Set-Cookie": clearSessionCookie() });
}

app.http("authLogin", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: authLogin,
});

app.http("authSession", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/session",
  handler: authSession,
});

app.http("authLogout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/logout",
  handler: authLogout,
});

module.exports = { authLogin, authSession, authLogout };
