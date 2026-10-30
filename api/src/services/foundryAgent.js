const { AIProjectClient } = require("@azure/ai-projects");
const { ClientSecretCredential } = require("@azure/identity");

class FoundryConfigurationError extends Error {
  constructor() {
    super("Azure AI Foundry settings are incomplete.");
    this.name = "FoundryConfigurationError";
  }
}

class FoundryRequestError extends Error {
  constructor(operation, cause) {
    super("Azure AI Foundry request failed.");
    this.name = "FoundryRequestError";
    this.operation = operation;
    this.providerErrorName = cause instanceof Error ? cause.name : undefined;
    this.statusCode = Number.isInteger(cause?.statusCode)
      ? cause.statusCode
      : Number.isInteger(cause?.status)
        ? cause.status
        : undefined;
    this.errorCode = typeof cause?.code === "string" ? cause.code : undefined;
    this.errorParam = typeof cause?.param === "string" ? cause.param : undefined;
    this.errorType = typeof cause?.type === "string" ? cause.type : undefined;
  }
}

async function withOperation(operation, action) {
  try {
    return await action();
  } catch (error) {
    throw new FoundryRequestError(operation, error);
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
    const newProjectClient = new AIProjectClient(settings.endpoint, credential);
    const newOpenAIClient = newProjectClient.getOpenAIClient({ timeout: 120_000 });
    projectClient = newProjectClient;
    openAIClient = newOpenAIClient;
  }
  return openAIClient;
}

async function sendAgentMessage({ messages }) {
  const settings = getFoundrySettings();
  const { agentName, agentVersion } = settings;
  const client = await withOperation("create_client", () => getClient(settings));

  const response = await withOperation("run_agent_response", () => client.responses.create({
    input: messages,
    agent_reference: {
      name: agentName,
      version: agentVersion,
      type: "agent_reference",
    },
  }));

  if (typeof response.output_text !== "string" || response.output_text.length === 0) {
    throw new FoundryRequestError("read_agent_response", new Error("The Foundry agent returned no text response."));
  }

  return { reply: response.output_text };
}

module.exports = { FoundryConfigurationError, FoundryRequestError, sendAgentMessage };
