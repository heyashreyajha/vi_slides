import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // auto scroll (small but important UX fix)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { content: input, role: "user" };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5050/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) throw new Error("Failed request");

      const data: ChatResponse = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response";

      setMessages((prev) => [
        ...prev,
        { content: reply, role: "assistant" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Gemini Assistant</h2>

      <div
        style={{
          border: "1px solid #ddd",
          minHeight: "450px",
          maxHeight: "650px",
          overflowY: "auto",
          padding: "20px",
          borderRadius: "10px",
          background: "#fafafa",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background:
                  msg.role === "user" ? "#007bff" : "#f1f1f1",
                color: msg.role === "user" ? "#fff" : "#000",
                maxWidth: "75%",
                whiteSpace: "pre-wrap",
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: "6px 0" }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: "20px", margin: "8px 0" }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: "4px" }}>{children}</li>,
                  code: ({ children }) => (
                    <code
                      style={{
                        background: "#eaeaea",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    >
                      {children}
                    </code>
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && <div style={{ fontSize: "13px" }}>Typing...</div>}

        <div ref={chatEndRef} />
      </div>

      <div style={{ display: "flex", marginTop: "15px", gap: "10px" }}>
        <input
          style={{ flex: 1, padding: "10px" }}
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;