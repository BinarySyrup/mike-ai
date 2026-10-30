const { app } = require("@azure/functions");
const { getValidSession } = require("../auth");
const { getRequestId, jsonResponse } = require("../http");
const { FoundryConfigurationError, sendAgentMessage } = require("../services/foundryAgent");

const MAX_MESSAGE_LENGTH = 10000;
const MAX_MESSAGES = 40;
const MAX_CONVERSATION_LENGTH = 30000;
const MAX_REQUEST_BYTES = 128000;

async function chatMessage(request, context) {
  const requestId = getRequestId(context);
  const session = getValidSession(request);
  if (!session) {
    return jsonResponse(401, { error: "Your session has expired. Please sign in again.", requestId });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(413, { error: "Request is too large.", requestId });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON.", requestId });
  }

  const messages = body && Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return jsonResponse(400, { error: `Send between 1 and ${MAX_MESSAGES} messages. Start a new chat if needed.`, requestId });
  }

  let totalCharacters = 0;
  const validatedMessages = [];
  for (const item of messages) {
    if (!item || !["user", "assistant"].includes(item.role)
      || typeof item.content !== "string"
      || item.content.trim().length === 0
      || item.content.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(400, { error: "Conversation message is invalid.", requestId });
    }
    totalCharacters += item.content.length;
    if (totalCharacters > MAX_CONVERSATION_LENGTH) {
      return jsonResponse(413, { error: "Conversation is too long. Start a new chat to continue.", requestId });
    }
    validatedMessages.push({ role: item.role, content: item.content });
  }
  if (validatedMessages[0].role !== "user" || validatedMessages.at(-1).role !== "user") {
    return jsonResponse(400, { error: "Conversation must start and end with a user message.", requestId });
  }

  try {
    const result = await sendAgentMessage({ messages: validatedMessages });
    return jsonResponse(200, { reply: result.reply });
  } catch (error) {
    if (error instanceof FoundryConfigurationError) {
      context.error(JSON.stringify({ event: "foundry_configuration_error", requestId }));
      return jsonResponse(503, { error: "The Azure AI Foundry agent connection is not configured.", requestId });
    }

    context.error(JSON.stringify({
      event: "chat_request_failed",
      requestId,
      operation: typeof error?.operation === "string" ? error.operation : undefined,
      errorName: typeof error?.providerErrorName === "string"
        ? error.providerErrorName
        : error instanceof Error
          ? error.name
          : "UnknownError",
      statusCode: Number.isInteger(error?.statusCode)
        ? error.statusCode
        : Number.isInteger(error?.status)
          ? error.status
          : undefined,
      errorCode: typeof error?.errorCode === "string"
        ? error.errorCode
        : typeof error?.code === "string"
          ? error.code
          : undefined,
      errorParam: typeof error?.errorParam === "string"
        ? error.errorParam
        : typeof error?.param === "string"
          ? error.param
          : undefined,
      errorType: typeof error?.errorType === "string"
        ? error.errorType
        : typeof error?.type === "string"
          ? error.type
          : undefined,
    }));
    return jsonResponse(502, { error: "The assistant could not respond. Please try again.", requestId });
  }
}

app.http("chatMessage", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "chat",
  handler: chatMessage,
});

module.exports = { chatMessage };
