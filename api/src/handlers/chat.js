const { app } = require("@azure/functions");
const {
  createConversationHandle,
  getValidSession,
  resolveConversationHandle,
} = require("../auth");
const { getRequestId, jsonResponse } = require("../http");
const { FoundryConfigurationError, sendAgentMessage } = require("../services/foundryAgent");

const MAX_MESSAGE_LENGTH = 10000;
const MAX_CONVERSATION_ID_LENGTH = 256;

async function chatMessage(request, context) {
  const requestId = getRequestId(context);
  const session = getValidSession(request);
  if (!session) {
    return jsonResponse(401, { error: "Your session has expired. Please sign in again.", requestId });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16000) {
    return jsonResponse(413, { error: "Request is too large.", requestId });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON.", requestId });
  }

  const message = body && typeof body.message === "string" ? body.message : "";
  const conversationHandle = body && typeof body.conversationId === "string" ? body.conversationId : undefined;
  if (!message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(400, { error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`, requestId });
  }
  if (conversationHandle && conversationHandle.length > MAX_CONVERSATION_ID_LENGTH) {
    return jsonResponse(400, { error: "Conversation identifier is invalid.", requestId });
  }

  const conversationId = conversationHandle
    ? resolveConversationHandle(conversationHandle, session)
    : undefined;
  if (conversationHandle && !conversationId) {
    return jsonResponse(400, { error: "Conversation identifier is invalid.", requestId });
  }

  try {
    const result = await sendAgentMessage({ message, conversationId });
    return jsonResponse(200, {
      reply: result.reply,
      conversationId: createConversationHandle(result.conversationId, session),
    });
  } catch (error) {
    if (error instanceof FoundryConfigurationError) {
      context.error(JSON.stringify({ event: "foundry_configuration_error", requestId }));
      return jsonResponse(503, { error: "The Azure AI Foundry agent connection is not configured.", requestId });
    }

    context.error(JSON.stringify({
      event: "chat_request_failed",
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      statusCode: Number.isInteger(error?.status) ? error.status : undefined,
      errorCode: typeof error?.code === "string" ? error.code : undefined,
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
