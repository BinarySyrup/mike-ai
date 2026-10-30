const http = require("node:http");
const crypto = require("node:crypto");
const path = require("node:path");

process.env.NODE_ENV ||= "development";
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { authLogin, authSession, authLogout } = require("./handlers/auth");
const { chatMessage } = require("./handlers/chat");

const MAX_BODY_BYTES = 16 * 1024;
const routes = new Map([
  ["POST /api/auth/login", authLogin],
  ["GET /api/auth/session", authSession],
  ["POST /api/auth/logout", authLogout],
  ["POST /api/chat", chatMessage],
]);

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    request.on("end", () => resolve(tooLarge ? null : Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function writeJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (incoming, outgoing) => {
  let url;
  try {
    url = new URL(incoming.url || "/", "http://127.0.0.1");
  } catch {
    writeJson(outgoing, 400, { error: "Invalid request URL." });
    return;
  }

  const routeKey = `${incoming.method || "GET"} ${url.pathname.replace(/\/$/, "") || "/"}`;
  const handler = routes.get(routeKey);
  if (!handler) {
    writeJson(outgoing, 404, { error: "API route not found." });
    return;
  }

  let body;
  try {
    body = await readBody(incoming);
  } catch {
    writeJson(outgoing, 400, { error: "Could not read request body." });
    return;
  }
  if (body === null) {
    writeJson(outgoing, 413, { error: "Request is too large." });
    return;
  }

  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie", "x-forwarded-for"]) {
    const value = incoming.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }
  if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", incoming.socket.remoteAddress || "127.0.0.1");
  }
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const method = incoming.method || "GET";
  const requestOptions = { method, headers };
  if (method !== "GET" && method !== "HEAD") requestOptions.body = body;
  const apiRequest = new Request(`http://127.0.0.1${url.pathname}${url.search}`, requestOptions);
  const context = {
    invocationId: crypto.randomUUID(),
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
  };

  try {
    const result = await handler(apiRequest, context);
    const responseHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(result.headers || {}),
    };
    outgoing.writeHead(result.status || 200, responseHeaders);
    outgoing.end(JSON.stringify(result.jsonBody ?? null));
  } catch (error) {
    console.error(JSON.stringify({
      event: "local_api_error",
      requestId: context.invocationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
    writeJson(outgoing, 500, { error: "The local API could not handle the request." });
  }
});

const port = Number(process.env.API_PORT || 7071);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT must be a valid TCP port.");
}

server.listen(port, "127.0.0.1", () => {
  console.log(`MikeAI API listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
