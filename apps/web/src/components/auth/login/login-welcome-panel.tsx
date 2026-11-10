'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Sparkles, Clock } from 'lucide-react';

// Verified Event Date: December 3, 2026 09:00 IST (UTC: 2026-12-03T03:30:00Z)
const NIRAL_EVENT_START = new Date('2026-12-03T03:30:00Z').getTime();

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function LoginWelcomePanel() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setNow(Date.now());
    });
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = now ? Math.max(0, NIRAL_EVENT_START - now) : 0;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  const highlights = [
    { label: 'Duration', value: '36 Hours', icon: Clock },
    { label: 'Format', value: 'In-Person', icon: MapPin },
    { label: 'Innovation Tracks', value: '6 Themes', icon: Sparkles },
    { label: 'Event Date', value: 'Dec 3–4, 2026', icon: CalendarDays },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#111] bg-[#FAF7F2] p-8 shadow-[0_6px_0_#111]">
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#111] bg-[#FD9B9B] px-3.5 py-1 text-[11px] font-bold tracking-wider text-[#111] shadow-[0_2px_0_#111]">
          NIRAL 2026 · SECURE ACCESS
        </span>
        <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
          Welcome back to <mark className="rounded bg-[#FFE2DB] px-1 text-inherit">NIRAL.</mark>
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#696969]">
          Sign in to continue your innovation journey, manage your team, and access your participant dashboard.
        </p>
      </div>

      <div className="relative z-10 mt-8">
        <div className="flex items-center justify-between">
          <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider text-[#111]">
            Countdown to NIRAL 2026 (IST)
          </p>
          <span className="text-[10px] font-semibold text-[#696969]">Coimbatore, TN</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ['Days', days],
            ['Hours', hours],
            ['Mins', mins],
            ['Secs', secs],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="rounded-xl border-2 border-[#111] bg-white p-2.5 text-center shadow-[0_3px_0_#111]"
            >
              <div className="font-mono text-xl font-bold tabular-nums text-[#111]">
                {now === null ? '--' : pad(value as number)}
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#696969]">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
        {highlights.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border-2 border-[#111] bg-white p-3 shadow-[0_3px_0_#111]"
          >
            <item.icon className="h-4 w-4 text-[#FD9B9B]" aria-hidden />
            <p className="mt-2 font-['Space_Grotesk'] text-sm font-bold text-[#111]">
              {item.value}
            </p>
            <p className="text-[11px] text-[#696969]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
