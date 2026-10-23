"use client";

import { useState } from "react";
import Link from "next/link";
import { Sliders, X, Check, RotateCcw, ExternalLink } from "lucide-react";
import { useAppContent } from "@/store/content-context";
import { Button } from "@/components/ui/button";

export function LiveContentEditorDock() {
  const [open, setOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const { content, updateContent, resetToDefault } = useAppContent();

  const [eventName, setEventName] = useState(content.event?.name || "Niral Hackathon");
  const [tagline, setTagline] = useState(content.event?.tagline || "");
  const [venue, setVenue] = useState(content.event?.venue || "");
  const [prizePool, setPrizePool] = useState(content.event?.prizePool || 500000);
  const [emergencyEnabled, setEmergencyEnabled] = useState(
    content.emergencyBanner?.enabled || false
  );
  const [emergencyText, setEmergencyText] = useState(
    content.emergencyBanner?.message || ""
  );

  const handleSave = async () => {
    const success = await updateContent({
      event: {
        ...content.event,
        name: eventName,
        tagline,
        venue,
        prizePool: Number(prizePool) || 0,
      },
      emergencyBanner: {
        enabled: emergencyEnabled,
        message: emergencyText,
      },
    });

    if (success) {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset all content to initial seed values?")) {
      await resetToDefault();
      setEventName(content.event?.name || "Niral Hackathon");
      setTagline(content.event?.tagline || "");
      setVenue(content.event?.venue || "");
      setPrizePool(content.event?.prizePool || 500000);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => {
            setEventName(content.event?.name || "Niral Hackathon");
            setTagline(content.event?.tagline || "");
            setVenue(content.event?.venue || "");
            setPrizePool(content.event?.prizePool || 500000);
            setEmergencyEnabled(content.emergencyBanner?.enabled || false);
            setEmergencyText(content.emergencyBanner?.message || "");
            setOpen(!open);
          }}
          className="flex items-center gap-2 rounded-full border border-sky-400/40 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold tracking-wider text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] backdrop-blur-md transition hover:scale-105 hover:bg-slate-800"
          title="Quick Content Editor"
        >
          <Sliders className="h-4 w-4" />
          <span>Quick CMS</span>
        </button>
      </div>

      {/* Floating Modal Panel */}
      {open && (
        <div className="fixed bottom-20 left-6 z-50 w-96 rounded-2xl border border-sky-400/30 bg-[#090d1a]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-sky-400">
                Live Content Manager
              </p>
              <h3 className="font-display text-base font-bold text-white">
                Edit Site Dynamically
              </h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-muted hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1 text-xs">
            <div>
              <label className="text-muted block mb-1">Event / App Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-muted block mb-1">Main Tagline / Title</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-muted block mb-1">Venue / Format</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-muted block mb-1">Total Prize Pool (₹)</label>
              <input
                type="number"
                value={prizePool}
                onChange={(e) => setPrizePool(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <label className="flex items-center gap-2 font-medium text-red-300">
                <input
                  type="checkbox"
                  checked={emergencyEnabled}
                  onChange={(e) => setEmergencyEnabled(e.target.checked)}
                  className="rounded"
                />
                Show Emergency / Urgent Banner
              </label>
              {emergencyEnabled && (
                <textarea
                  rows={2}
                  value={emergencyText}
                  onChange={(e) => setEmergencyText(e.target.value)}
                  placeholder="Enter notice text..."
                  className="mt-2 w-full rounded-lg border border-red-500/30 bg-black/40 p-2 text-white focus:outline-none"
                />
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/admin/content"
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
              >
                <span>Full CMS Dashboard</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset All</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            {savedMessage ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" /> Updated live!
              </span>
            ) : (
              <span className="text-[11px] text-muted">All pages sync instantly</span>
            )}
            <Button size="sm" onClick={handleSave} className="h-8 px-4 text-xs">
              Apply Live
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
