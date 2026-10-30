const { AIProjectClient } = require("@azure/ai-projects");
const { ClientSecretCredential } = require("@azure/identity");

class FoundryConfigurationError extends Error {
  constructor() {
    super("Azure AI Foundry settings are incomplete.");
    this.name = "FoundryConfigurationError";
  }
}

let projectClient;
let openAIClient;

function getFoundrySettings() {
  const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT?.trim();
  const agentName = process.env.AZURE_AI_AGENT_NAME?.trim();
  const agentVersion = process.env.AZURE_AI_AGENT_VERSION?.trim();
  const tenantId = process.env.AZURE_TENANT_ID?.trim();
  const clientId = process.env.AZURE_CLIENT_ID?.trim();
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!endpoint || !agentName || !agentVersion || !tenantId || !clientId || !clientSecret) {
    throw new FoundryConfigurationError();
  }

  let parsedEndpoint;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new FoundryConfigurationError();
  }
  if (parsedEndpoint.protocol !== "https:") throw new FoundryConfigurationError();

  return { endpoint, agentName, agentVersion, tenantId, clientId, clientSecret };
}

function getClient(settings) {
  if (!projectClient) {
    const credential = new ClientSecretCredential(
      settings.tenantId,
      settings.clientId,
      settings.clientSecret,
    );
    projectClient = new AIProjectClient(settings.endpoint, credential);
    openAIClient = projectClient.getOpenAIClient({ timeout: 120_000 });
  }
  return openAIClient;
}

async function sendAgentMessage({ message, conversationId }) {
  const settings = getFoundrySettings();
  const { agentName, agentVersion } = settings;
  const client = getClient(settings);
  let activeConversationId = conversationId;

  if (activeConversationId) {
    await client.conversations.items.create(activeConversationId, {
      items: [{ type: "message", role: "user", content: message }],
    });
  } else {
    const conversation = await client.conversations.create({
      items: [{ type: "message", role: "user", content: message }],
    });
    activeConversationId = conversation.id;
  }

  const response = await client.responses.create(
    { conversation: activeConversationId },
    { body: { agent: { type: "agent_reference", name: agentName, version: agentVersion } } },
  );

  if (typeof response.output_text !== "string" || response.output_text.length === 0) {
    throw new Error("The Foundry agent returned no text response.");
  }

  return { reply: response.output_text, conversationId: activeConversationId };
}

module.exports = { FoundryConfigurationError, sendAgentMessage };
