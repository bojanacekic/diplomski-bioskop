import { useEffect, useRef, useState } from "react";
import { supportService } from "../services/supportService";
import { toSupportChatRequestDto } from "../dtos/supportRequestDtos";

const welcomeMessage = {
  role: "assistant",
  content: "Hi! I’m the Smart Cinema assistant. Ask me in English or Serbian.",
};

export default function AiSupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, sending]);

  const submit = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;

    const history = messages
      .filter((item) => item !== welcomeMessage)
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: message }]);
    setDraft("");
    setSending(true);

    try {
      const response = await supportService.sendMessage(toSupportChatRequestDto(message, history));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "The AI assistant is unavailable.");
      setMessages((current) => [...current, { role: "assistant", content: payload.message }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "error", content: error.message }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className={`ai-support ${open ? "open" : ""}`}>
      {open && (
        <section className="ai-chat-panel" aria-label="AI customer support">
          <header>
            <div><strong>Smart Cinema AI</strong><span>English · Srpski</span></div>
            <button onClick={() => setOpen(false)} aria-label="Close support chat">×</button>
          </header>
          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((item, index) => (
              <p className={`ai-message ${item.role}`} key={`${item.role}-${index}`}>{item.content}</p>
            ))}
            {sending && <p className="ai-message assistant typing">Thinking<span>…</span></p>}
            <div ref={endRef} />
          </div>
          <form onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about tickets, reservations…"
              maxLength={1000}
              disabled={sending}
              aria-label="Message"
            />
            <button disabled={sending || !draft.trim()} aria-label="Send message">Send</button>
          </form>
          <small>AI can make mistakes. Check important ticket details.</small>
        </section>
      )}
      <button className="ai-chat-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>{open ? "×" : "✦"}</span>{open ? "Close" : "Need help?"}
      </button>
    </aside>
  );
}
