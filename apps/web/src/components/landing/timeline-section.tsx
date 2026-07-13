"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Milestone = {
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  ics: {
    uid: string;
    start: string;
    end: string;
  };
};

const milestones: Milestone[] = [
  {
    title: "Registration Opens",
    date: "Jul 20, 2026",
    time: "09:00 IST",
    venue: "Online · HackOS Portal",
    description: "Accounts, track selection, and team invites go live.",
    ics: {
      uid: "reg-open@hackos",
      start: "20260720T033000Z",
      end: "20260720T043000Z",
    },
  },
  {
    title: "Workshops",
    date: "Aug 8–10, 2026",
    time: "10:00–17:00 IST",
    venue: "IoT Lab + Hybrid Stream",
    description: "Hardware, MQTT, edge AI, and pitch clinics.",
    ics: {
      uid: "workshops@hackos",
      start: "20260808T043000Z",
      end: "20260808T113000Z",
    },
  },
  {
    title: "Team Formation",
    date: "Aug 12, 2026",
    time: "18:00 IST",
    venue: "Matching Lobby",
    description: "Finalize 2–4 member teams and mentor preferences.",
    ics: {
      uid: "teams@hackos",
      start: "20260812T123000Z",
      end: "20260812T143000Z",
    },
  },
  {
    title: "Hackathon Begins",
    date: "Aug 15, 2026",
    time: "09:00 IST",
    venue: "Campus Innovation Hall",
    description: "Problem drop, kit desks open, leaderboard resets.",
    ics: {
      uid: "kickoff@hackos",
      start: "20260815T033000Z",
      end: "20260815T053000Z",
    },
  },
  {
    title: "Mentor Reviews",
    date: "Aug 16, 2026",
    time: "11:00–20:00 IST",
    venue: "Mentor Desks A–D",
    description: "Checkpoint demos and architecture reviews.",
    ics: {
      uid: "mentors@hackos",
      start: "20260816T053000Z",
      end: "20260816T143000Z",
    },
  },
  {
    title: "Prototype Submission",
    date: "Aug 17, 2026",
    time: "10:00 IST",
    venue: "Submission Portal",
    description: "Repo, video, and architecture lock for judging.",
    ics: {
      uid: "submit@hackos",
      start: "20260817T043000Z",
      end: "20260817T053000Z",
    },
  },
  {
    title: "Final Presentation",
    date: "Aug 17, 2026",
    time: "14:00 IST",
    venue: "Main Arena",
    description: "Live demos with transparent scorecards.",
    ics: {
      uid: "finals@hackos",
      start: "20260817T083000Z",
      end: "20260817T113000Z",
    },
  },
  {
    title: "Awards Ceremony",
    date: "Aug 17, 2026",
    time: "18:00 IST",
    venue: "Main Arena Stage",
    description: "Track winners, sponsor awards, and closing notes.",
    ics: {
      uid: "awards@hackos",
      start: "20260817T123000Z",
      end: "20260817T143000Z",
    },
  },
];

function downloadIcs(item: Milestone) {
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HackOS//Timeline//EN",
    "BEGIN:VEVENT",
    `UID:${item.ics.uid}`,
    `DTSTAMP:${item.ics.start}`,
    `DTSTART:${item.ics.start}`,
    `DTEND:${item.ics.end}`,
    `SUMMARY:HackOS — ${item.title}`,
    `DESCRIPTION:${item.description.replace(/,/g, "\\,")}`,
    `LOCATION:${item.venue.replace(/,/g, "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hackos-${item.title.toLowerCase().replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TimelineSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="timeline" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Innovation Timeline
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          From registration to awards — your event journey with calendar reminders.
        </p>

        <ol className="relative mt-10 space-y-6 border-l border-sky-400/20 pl-8">
          {milestones.map((item, index) => (
            <motion.li
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="relative"
            >
              <span className="absolute -left-[2.4rem] top-1.5 h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.8)]" />
              <div className="flex flex-col gap-3 rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
                    {item.date} · {item.time}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                  <p className="mt-2 font-mono text-[11px] text-sky-300/90">
                    Venue · {item.venue}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => downloadIcs(item)}
                >
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                  Add reminder
                </Button>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
