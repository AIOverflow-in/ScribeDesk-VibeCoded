"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEncounterStore } from "@/lib/store/encounterStore";
import { useUIStore } from "@/lib/store/uiStore";
import { getAccessToken } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ContextChat() {
  const { encounter } = useEncounterStore();
  const { chatOpen, setChatOpen } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !encounter || streaming) return;

    const userMsg = input.trim();
    setInput("");
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
        body: JSON.stringify({ message: userMsg }),
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
            const token = line.slice(6);
            if (token === "[DONE]") break;
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
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 flex flex-col z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p>Ask me anything about this patient or encounter.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              {msg.role === "user"
                ? <User className="w-3 h-3 text-gray-500" />
                : <Bot className="w-3 h-3 text-gray-500" />
              }
            </div>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
              msg.role === "user"
                ? "bg-black text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-800 rounded-tl-sm"
            )}>
              {msg.content || (streaming && i === messages.length - 1 ? "..." : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-100 flex gap-2">
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
          className="bg-black text-white hover:bg-gray-800"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
