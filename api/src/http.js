function jsonResponse(status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
    jsonBody: body,
  };
}

function getRequestId(context) {
  return context.invocationId || "unknown";
}

module.exports = { getRequestId, jsonResponse };
