export type ChatReply = {
  reply: string;
  conversationId: string;
};

type ErrorPayload = { error?: string };

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorPayload;
    if (body.error) return body.error;
  } catch {
    // Use the status-specific fallback when the API did not return JSON.
  }
  return `Request failed (${response.status}).`;
}

export async function checkSession(): Promise<boolean> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (response.status === 401) return false;
  if (!response.ok) throw new ApiError(await readError(response), response.status);
  return true;
}

export async function logIn(code: string): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) throw new ApiError(await readError(response), response.status);
}

export async function logOut(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new ApiError(await readError(response), response.status);
}

export async function sendChatMessage(
  message: string,
  conversationId: string | null,
): Promise<ChatReply> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message, conversationId: conversationId || undefined }),
  });

  if (!response.ok) throw new ApiError(await readError(response), response.status);
  return (await response.json()) as ChatReply;
}
