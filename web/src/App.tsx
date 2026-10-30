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
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { ApiError, checkSession, logIn, logOut, sendChatMessage } from "./api";

type AuthState = "checking" | "signed-out" | "signed-in";
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

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
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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

  function clearChat() {
    setMessages([]);
    setDraft("");
    setChatError("");
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
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
          <Box className="brand-lockup auth-brand">
            <Avatar className="brand-mark"><AutoAwesomeRoundedIcon /></Avatar>
            <Box>
              <Typography variant="h6" className="brand-name">MikeAI</Typography>
              <Typography variant="caption" color="text.secondary">Private assistant</Typography>
            </Box>
          </Box>

          <Paper className="auth-card" elevation={0}>
            <Avatar className="auth-icon"><LockRoundedIcon /></Avatar>
            <Typography variant="h4" className="auth-title">Welcome back</Typography>
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
                inputProps={{ "aria-label": "Access code" }}
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
          <Box className="brand-lockup">
            <Avatar className="brand-mark"><AutoAwesomeRoundedIcon /></Avatar>
            <Box>
              <Typography variant="subtitle1" className="brand-name">MikeAI</Typography>
              <Typography variant="caption" color="text.secondary">AI assistant</Typography>
            </Box>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Button
              className="new-chat-button"
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={clearChat}
              disabled={sending || logoutBusy}
            >
              New chat
            </Button>
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
          <Typography variant="overline" className="eyebrow">YOUR PRIVATE ASSISTANT</Typography>
          <Typography variant="h4" className="chat-title">What can I help with?</Typography>
          <Typography color="text.secondary">
            Ask a question to begin. A new conversation starts fresh, and chat history is not saved in this app.
          </Typography>
        </Box>

        <Box className="transcript" aria-live="polite" aria-label="Conversation">
          {messages.length === 0 ? (
            <Paper className="empty-state" elevation={0}>
              <Avatar className="empty-avatar"><SmartToyRoundedIcon /></Avatar>
              <Typography variant="h6">Start a new conversation</Typography>
              <Typography color="text.secondary" variant="body2">
                Your messages will appear here while this page is open.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2.5} className="message-list">
              {messages.map((message) => (
                <Box key={message.id} className={`message-row ${message.role}`}>
                  {message.role === "assistant" && <Avatar className="message-avatar"><SmartToyRoundedIcon /></Avatar>}
                  <Paper elevation={0} className={`message-bubble ${message.role}`}>
                    <Typography component="div" className="message-content">{message.content}</Typography>
                  </Paper>
                  {message.role === "user" && <Avatar className="user-avatar">Y</Avatar>}
                </Box>
              ))}
              {sending && (
                <Box className="message-row assistant" role="status">
                  <Avatar className="message-avatar"><SmartToyRoundedIcon /></Avatar>
                  <Paper elevation={0} className="message-bubble assistant typing-bubble">
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">Thinking…</Typography>
                  </Paper>
                </Box>
              )}
              <div ref={transcriptEndRef} />
            </Stack>
          )}
        </Box>

        <Box component="form" onSubmit={handleSend} className="composer-area">
          {chatError && <Alert severity="warning" onClose={() => setChatError("")}>{chatError}</Alert>}
          <Paper className="composer" elevation={0}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={6}
              placeholder="Message MikeAI…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              disabled={sending || logoutBusy}
              inputProps={{ "aria-label": "Message MikeAI" }}
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
          <Typography variant="caption" color="text.secondary" className="composer-caption">
            Conversations are temporary and are not saved by this app.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
