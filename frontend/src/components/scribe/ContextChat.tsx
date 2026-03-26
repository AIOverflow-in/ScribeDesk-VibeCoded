"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, User, GripVertical, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { useUIStore } from "@/lib/store/uiStore";
import { getAccessToken, BASE_URL } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function AssistantMessage({ content, streaming }: { content: string; streaming: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!content && streaming) {
    return (
      <span className="inline-flex gap-1 py-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    );
  }

  return (
    <div className="group relative">
      <div className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-semibold prose-headings:font-semibold prose-headings:text-gray-900">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-snug">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            h1: ({ children }) => <h1 className="text-base font-semibold mt-2 mb-1">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-1">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>,
            code: ({ children }) => (
              <code className="bg-gray-200 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
            ),
            hr: () => <hr className="my-2 border-gray-200" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {content && (
        <button
          onClick={handleCopy}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
          title="Copy response"
        >
          {copied
            ? <Check className="w-3 h-3 text-green-600" />
            : <Copy className="w-3 h-3 text-gray-400" />
          }
        </button>
      )}
    </div>
  );
}

export function ContextChat() {
  const { encounter } = useEncounterStore();
  const { chatOpen, setChatOpen } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(360);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      setPanelWidth(Math.min(640, Math.max(300, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !encounter || streaming) return;

    const userMsg = input.trim();
    setInput("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setStreaming(true);

    try {
      const token = getAccessToken();
      const res = await fetch(`${BASE_URL}/encounters/${encounter.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg, history }),
      });

      if (!res.body) throw new Error("No stream");

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            if (raw === "[DONE]") break;
            // Unescape newlines that were escaped before SSE transmission
            const token = raw.replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
            setMessages((m) => {
              const last = m[m.length - 1];
              return [...m.slice(0, -1), { ...last, content: last.content + token }];
            });
          }
        }
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally {
      setStreaming(false);
    }
  };

  if (!chatOpen) return null;

  return (
    <div
      className="fixed right-0 top-0 h-full bg-white border-l border-gray-200 flex flex-col z-40 shadow-xl"
      style={{ width: panelWidth }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 transition-colors group"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <GripVertical className="w-4 h-4 text-gray-300" />
          <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-10">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p>Ask me anything about this patient or encounter.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 mt-0.5">
              {msg.role === "user"
                ? <User className="w-3 h-3 text-gray-500" />
                : <Bot className="w-3 h-3 text-gray-500" />
              }
            </div>
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm bg-black text-white">
                {msg.content}
              </div>
            ) : (
              <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-3 py-2.5">
                <AssistantMessage
                  content={msg.content}
                  streaming={streaming && i === messages.length - 1}
                />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={encounter ? "Ask about this encounter..." : "Start a session first"}
          disabled={!encounter || streaming}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="text-sm"
        />
        <Button
          size="sm"
          onClick={sendMessage}
          disabled={!encounter || !input.trim() || streaming}
          className="bg-black text-white hover:bg-gray-800 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
