"use client";

import { useState } from "react";
import { Bot, ImagePlus, Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const topics = [
  "Rules",
  "Schedule",
  "Registration",
  "Themes",
  "Hardware",
  "Mentors",
  "Judging",
  "Venue",
  "FAQs",
  "Documentation",
  "Project Ideas",
];

const replies: Record<string, string> = {
  Rules:
    "Teams of 2–4. Original work only. Hardware kits via volunteer desk. Full rulebook is in Resources.",
  Schedule:
    "Registration → Workshops → Team Formation → Hackathon → Mentors → Submission → Finals → Awards. See Timeline for ICS reminders.",
  Registration:
    "Use Register Now on the hero or /register. Seats show on Registration Progress.",
  Themes:
    "Six tracks: Industrial Automation, Smart Agriculture, Healthcare IoT, Smart Cities, Energy, AI + IoT.",
  Hardware:
    "ESP32, RPi, STM32, sensors, LoRa kits via Components Issued. Request early — pools are limited.",
  Mentors:
    "Book sessions from your dashboard once registered. Mentor Marathon is on day two.",
  Judging:
    "Innovation, technical depth, presentation, scalability, impact, UI, business value.",
  Venue:
    "Hybrid — Campus Innovation Hall + online streams for workshops.",
  FAQs: "Open the FAQ accordion near the footer for eligibility, kits, and team size.",
  Documentation:
    "Featured Technologies cards link to official docs; Resources has starter kits.",
  "Project Ideas":
    "Browse Event Themes and Problem Statements for sample projects and architectures.",
  default:
    "Ask about rules, schedule, registration, themes, hardware, mentors, judging, venue, FAQs, docs, or project ideas.",
};

type Msg = { role: "user" | "assistant"; text: string };

export function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi — I’m the Niral Hackathon assistant. Ask about rules, schedule, hardware, or themes.",
    },
  ]);

  function ask(topic: string) {
    const answer = replies[topic] ?? replies.default;
    setMessages((m) => [
      ...m,
      { role: "user", text: topic },
      { role: "assistant", text: answer },
    ]);
  }

  return (
    <div id="ai-assistant" className="fixed bottom-24 right-5 z-40 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="glass mb-3 flex h-[28rem] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-3xl border border-sky-400/25 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-sky-300" />
              <p className="font-display text-sm font-semibold text-white">
                AI Assistant
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted hover:bg-white/5"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                  msg.role === "assistant"
                    ? "bg-white/[0.06] text-foreground"
                    : "ml-auto bg-sky-500/20 text-sky-50",
                )}
              >
                {msg.text}
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5">
              {topics.slice(0, 6).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] text-muted hover:border-sky-400/30 hover:text-sky-200"
                  onClick={() => ask(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <form
            className="flex items-center gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              ask(input.trim());
              setInput("");
            }}
          >
            <button
              type="button"
              className="rounded-lg p-2 text-muted hover:bg-white/5"
              aria-label="Voice input (preview)"
              title="Voice input preview"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-muted hover:bg-white/5"
              aria-label="Image upload (preview)"
              title="Image upload preview"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input
              className="field-input !rounded-xl !py-2 text-sm"
              placeholder="Ask Niral Hackathon…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" size="sm" className="cta-primary shrink-0 px-3">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="glow-ring ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}
