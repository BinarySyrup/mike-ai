import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ReactMarkdown from "react-markdown";
import { ApiError, checkSession, logIn, logOut, sendChatMessage } from "./api";

type AuthState = "checking" | "signed-out" | "signed-in";
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type Feedback = "helpful" | "not-helpful";

const starterPrompts = [
  "What's Mike's background?",
  "What has he built on Azure?",
  "Biggest career wins",
  "Is he open to new roles?",
  "Tell me a joke",
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function safeProfileUrl(value: string | undefined, allowMailto = false): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" || (allowMailto && url.protocol === "mailto:")) return url.href;
  } catch {
    return undefined;
  }

  return undefined;
}

const linkedInUrl = safeProfileUrl(import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/in/mcarroll12/");
const githubUrl = safeProfileUrl(import.meta.env.VITE_GITHUB_URL || "https://github.com/BinarySyrup");
const contactUrl = safeProfileUrl(import.meta.env.VITE_CONTACT_URL || "mailto:mike@binarysyrup.com", true);

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [loginCode, setLoginCode] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    checkSession()
      .then((authenticated) => {
        if (active) setAuthState(authenticated ? "signed-in" : "signed-out");
      })
      .catch((error: unknown) => {
        if (active) {
          setLoginError(`Unable to reach the sign-in service: ${errorMessage(error)}`);
          setAuthState("signed-out");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    transcriptEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [messages, sending]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginCode.trim() || loginBusy) return;

    setLoginBusy(true);
    setLoginError("");
    try {
      await logIn(loginCode);
      setLoginCode("");
      setAuthState("signed-in");
    } catch (error) {
      setLoginError(errorMessage(error));
    } finally {
      setLoginBusy(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setDraft("");
    setChatError("");
    setFeedback({});
    setCopiedMessageId("");
  }

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await logOut();
      clearChat();
      setAuthState("signed-out");
      setLoginError("");
    } catch (error) {
      setChatError(errorMessage(error));
    } finally {
      setLogoutBusy(false);
    }
  }

  async function submitMessage(value: string) {
    const message = value.trim();
    if (!message || sending) return;

    const userMessage = { id: crypto.randomUUID(), role: "user" as const, content: message };
    const transcript = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: "user" as const, content: message },
    ];
    setMessages((current) => [...current, userMessage]);
    setSending(true);
    setDraft("");
    setChatError("");

    try {
      const response = await sendChatMessage(transcript);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
      }]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearChat();
        setAuthState("signed-out");
        setLoginError("Your web session has ended. Enter an access code to continue.");
      } else {
        setChatError(errorMessage(error));
        setDraft(message);
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      }
    } finally {
      setSending(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(draft);
  }

  async function handleRegenerate(messageId: string) {
    if (sending) return;
    const messageIndex = messages.findIndex((message) => message.id === messageId);
    if (messageIndex < 0) return;

    const transcript = messages
      .slice(0, messageIndex)
      .map(({ role, content }) => ({ role, content }));
    if (transcript.length === 0 || transcript.at(-1)?.role !== "user") return;

    setSending(true);
    setChatError("");
    try {
      const response = await sendChatMessage(transcript);
      setMessages((current) => current.map((message) => (
        message.id === messageId ? { ...message, content: response.reply } : message
      )));
      setFeedback((current) => {
        const next = { ...current };
        delete next[messageId];
        return next;
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearChat();
        setAuthState("signed-out");
        setLoginError("Your web session has ended. Enter an access code to continue.");
      } else {
        setChatError(errorMessage(error));
      }
    } finally {
      setSending(false);
    }
  }

  async function handleCopy(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(""), 1800);
    } catch {
      setChatError("Couldn't copy that answer. Please select and copy it manually.");
    }
  }

  function toggleFeedback(messageId: string, value: Feedback) {
    setFeedback((current) => {
      const next = { ...current };
      if (current[messageId] === value) delete next[messageId];
      else next[messageId] = value;
      return next;
    });
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.closest("form");
      form?.requestSubmit();
    }
  }

  if (authState === "checking") {
    return (
      <Box className="loading-screen" role="status" aria-label="Checking sign-in">
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (authState === "signed-out") {
    return (
      <Box className="auth-screen">
        <Container maxWidth="sm">
          <Box className="auth-brand">
            <Box component="img" className="auth-logo" src="/mikeai-logo.svg" alt="MikeAI" />
            <Typography variant="caption" color="text.secondary">Private AI Assistant</Typography>
          </Box>

          <Paper className="auth-card" elevation={0}>
            <Avatar className="auth-icon"><LockRoundedIcon /></Avatar>
            <Typography variant="h4" className="auth-title">Welcome to Mike AI</Typography>
            <Typography color="text.secondary" className="auth-description">
              Enter an access code to start a private chat session.
            </Typography>

            <Box component="form" onSubmit={handleLogin} className="auth-form">
              <TextField
                autoFocus
                fullWidth
                label="Access code"
                type="password"
                autoComplete="one-time-code"
                value={loginCode}
                onChange={(event) => setLoginCode(event.target.value)}
                disabled={loginBusy}
                slotProps={{ htmlInput: { "aria-label": "Access code" } }}
              />
              {loginError && <Alert severity="error">{loginError}</Alert>}
              <Button
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disabled={loginBusy || !loginCode.trim()}
                endIcon={loginBusy ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
              >
                {loginBusy ? "Checking code" : "Continue"}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" className="access-note">
              Access is limited to people with a valid code.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="app-shell">
      <AppBar position="sticky" elevation={0} color="inherit" className="topbar">
        <Toolbar className="topbar-content">
          <Box className="profile-lockup">
            <Box component="img" className="brand-mark" src="/mikeai-mark.svg" alt="MikeAI logo" />
            <Box className="profile-copy">
              <Typography variant="subtitle1" className="brand-name" aria-label="MikeAI">
                Mike<Box component="span" className="brand-ai">AI</Box>
              </Typography>
              <Typography variant="body2" color="text.secondary">Software Architect | Engineering Leader | Software Engineer</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={0.75} className="topbar-actions" sx={{ alignItems: "center" }}>
            <Box className="online-status" aria-label="MikeAI is online">
              <span className="online-dot" aria-hidden="true" />
              <Typography variant="body2">Online</Typography>
            </Box>

            {(linkedInUrl || githubUrl) && (
              <Box component="nav" className="social-links" aria-label="Professional profiles">
                {linkedInUrl && (
                  <Tooltip title="LinkedIn">
                    <IconButton component="a" href={linkedInUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
                      <LinkedInIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {githubUrl && (
                  <Tooltip title="GitHub">
                    <IconButton component="a" href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub profile">
                      <GitHubIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}

            <Tooltip title="Start a new conversation">
              <span>
                <IconButton
                  aria-label="Start a new conversation"
                  className="new-chat-button"
                  onClick={clearChat}
                  disabled={sending || logoutBusy}
                >
                  <AddRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="End web session">
              <span>
                <IconButton aria-label="Log out" onClick={handleLogout} disabled={logoutBusy || sending}>
                  {logoutBusy ? <CircularProgress size={20} /> : <LogoutRoundedIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" className="chat-container">
        <Box className="chat-heading">
          <Typography variant="h4" className="chat-title">Ask Mike AI Anything</Typography>
          <Typography color="text.secondary" className="chat-intro">
            Career, projects, and skills, straight from Mike's background.
            <br />
            Occasional dad jokes at no extra charge.
          </Typography>
          <Stack direction="row" useFlexGap className="starter-prompts" role="group" aria-label="Try asking">
            {starterPrompts.map((prompt, index) => (
              <Button
                key={prompt}
                type="button"
                variant="outlined"
                className={`starter-prompt${index === starterPrompts.length - 1 ? " joke-prompt" : ""}`}
                onClick={() => void submitMessage(prompt)}
                disabled={sending || logoutBusy}
              >
                {prompt}
              </Button>
            ))}
          </Stack>
        </Box>

        <Box className="transcript" aria-live="polite" aria-label="Conversation">
          {messages.length > 0 && (
            <Stack spacing={2.5} className="message-list">
              {messages.map((message) => (
                <Box key={message.id} className={`message-row ${message.role}`}>
                  {message.role === "assistant" ? (
                    <Box component="img" className="message-avatar" src="/mikeai-mark.svg" alt="" />
                  ) : null}
                  <Box className={`message-body ${message.role}`}>
                    {message.role === "assistant" ? (
                      <Typography component="div" className="message-content assistant">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </Typography>
                    ) : (
                      <Paper elevation={0} className="message-bubble user">
                        <Typography component="div" className="message-content user">{message.content}</Typography>
                      </Paper>
                    )}

                    {message.role === "assistant" && (
              <Stack direction="row" spacing={0.25} className="message-actions" role="group" aria-label="Answer actions">
                        <Tooltip title={copiedMessageId === message.id ? "Copied" : "Copy answer"}>
                          <IconButton size="small" aria-label="Copy answer" onClick={() => void handleCopy(message)}>
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Try again">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Regenerate answer"
                              onClick={() => void handleRegenerate(message.id)}
                              disabled={sending || messages[messages.length - 1]?.id !== message.id}
                            >
                              <RefreshRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Helpful">
                          <IconButton
                            size="small"
                            aria-label="Mark answer helpful"
                            aria-pressed={feedback[message.id] === "helpful"}
                            className={feedback[message.id] === "helpful" ? "feedback-selected" : ""}
                            onClick={() => toggleFeedback(message.id, "helpful")}
                          >
                            <ThumbUpAltOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Not helpful">
                          <IconButton
                            size="small"
                            aria-label="Mark answer not helpful"
                            aria-pressed={feedback[message.id] === "not-helpful"}
                            className={feedback[message.id] === "not-helpful" ? "feedback-selected" : ""}
                            onClick={() => toggleFeedback(message.id, "not-helpful")}
                          >
                            <ThumbDownAltOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Box>
                </Box>
              ))}
              {sending && (
                <Box className="message-row assistant" role="status">
                  <Box component="img" className="message-avatar" src="/mikeai-mark.svg" alt="" />
                  <Box className="message-body assistant typing-response">
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">Thinking…</Typography>
                  </Box>
                </Box>
              )}
              <div ref={transcriptEndRef} />
            </Stack>
          )}
        </Box>
      </Container>

      <Box className="composer-dock">
        <Container maxWidth="md" className="composer-container">
          {chatError && <Alert severity="warning" onClose={() => setChatError("")}>{chatError}</Alert>}
          <Box component="form" onSubmit={handleSend} className="composer-form">
            <Paper className="composer" elevation={0}>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={6}
                placeholder="Ask about Mike's career, or his questionable puns"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                disabled={sending || logoutBusy}
                slotProps={{ htmlInput: { "aria-label": "Ask Mike about his career" } }}
              />
              <Tooltip title="Send message">
                <span>
                  <IconButton
                    type="submit"
                    aria-label="Send message"
                    className="send-button"
                    disabled={sending || logoutBusy || !draft.trim()}
                  >
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Paper>
          </Box>
          <Typography variant="caption" color="text.secondary" className="composer-caption">
            {contactUrl && (
              <>AI-generated answers about Mike. For anything official, <Box component="a" href={contactUrl} className="contact-link">contact him directly.</Box></>
            )}
            {!contactUrl && "AI-generated answers about Mike. For anything official, contact him directly."}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
