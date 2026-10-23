"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  Globe,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  Layers,
  MapPin,
  Trophy,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { EventMode, EventStatus, type NiralEventConfig } from "@hackos/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminEventSettingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAuthorized = role === "ADMIN" || role === "ORGANIZER";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [eventData, setEventData] = useState<Partial<NiralEventConfig>>({
    name: "NIRAL Hackathon 2026",
    slug: "niral-2026",
    tagline: "The Future of Innovation Starts Here",
    publicDescription:
      "NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies platform for students, researchers, makers, and innovators.",
    organizerName: "NIRAL Organizing Committee",
    officialEmail: "hello@niralhackathon.com",
    contactPhone: "+91 98765 43210",
    websiteUrl: "https://niralhackathon.com",
    timezone: "Asia/Kolkata",
    startsAt: "2026-12-03T00:00:00.000Z",
    endsAt: "2026-12-04T23:59:59.000Z",
    hasExactTimes: false,
    venueName: "Campus Innovation Hall",
    venueAddress: "Academic City, Campus Hub",
    eventMode: EventMode.HYBRID,
    registrationStartsAt: null,
    registrationEndsAt: null,
    registrationEnabled: false,
    maxCapacity: 1000,
    minTeamSize: 2,
    maxTeamSize: 4,
    prizePool: 0,
    status: EventStatus.DRAFT,
    isPublished: true,
    isActive: true,
  });

  const [eventId, setEventId] = useState<string | null>(null);

  // Load existing event settings from PostgreSQL API
  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiUrl}/api/events/current`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setEventId(data.id);
            setEventData({
              name: data.name ?? "NIRAL Hackathon 2026",
              slug: data.slug ?? "niral-2026",
              tagline: data.tagline ?? "",
              publicDescription: data.publicDescription ?? data.description ?? "",
              organizerName: data.organizerName ?? "",
              officialEmail: data.officialEmail ?? "",
              contactPhone: data.contactPhone ?? "",
              websiteUrl: data.websiteUrl ?? "",
              timezone: data.timezone ?? "Asia/Kolkata",
              startsAt: data.startsAt ?? "2026-12-03T00:00:00.000Z",
              endsAt: data.endsAt ?? "2026-12-04T23:59:59.000Z",
              hasExactTimes: Boolean(data.hasExactTimes),
              venueName: data.venueName ?? "",
              venueAddress: data.venueAddress ?? "",
              eventMode: data.eventMode ?? EventMode.HYBRID,
              registrationStartsAt: data.registrationStartsAt ?? null,
              registrationEndsAt: data.registrationEndsAt ?? null,
              registrationEnabled: Boolean(data.registrationEnabled),
              maxCapacity: data.maxCapacity ?? 1000,
              minTeamSize: data.minTeamSize ?? 2,
              maxTeamSize: data.maxTeamSize ?? 4,
              prizePool: data.prizePool ?? 0,
              status: data.status ?? EventStatus.DRAFT,
              isPublished: Boolean(data.isPublished),
              isActive: Boolean(data.isActive),
            });
          }
        }
      } catch (err) {
        console.warn("Could not reach backend events API, using local configuration.", err);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validations
    if (!eventData.name?.trim()) {
      setError("Event name is required.");
      return;
    }

    if (
      eventData.startsAt &&
      eventData.endsAt &&
      new Date(eventData.startsAt) > new Date(eventData.endsAt)
    ) {
      setError("Event start date cannot be after the end date.");
      return;
    }

    if (
      (eventData.minTeamSize ?? 2) > (eventData.maxTeamSize ?? 4)
    ) {
      setError("Minimum team size cannot exceed maximum team size.");
      return;
    }

    try {
      setSaving(true);
      const token = (session?.user as { accessToken?: string })?.accessToken;

      const targetId = eventId || "niral-2026";
      const res = await fetch(`${apiUrl}/api/events/admin/${targetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message ?? `Failed to save event settings (HTTP ${res.status})`
        );
      }

      const updated = await res.json();
      if (updated?.id) setEventId(updated.id);
      setSuccess("Event configuration successfully updated and committed to PostgreSQL!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving event settings";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Link href="/login">
          <Button size="md" className="cta-primary">
            Sign in to access Event Settings
          </Button>
        </Link>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-[var(--background)]">
        <Shield className="h-10 w-10 text-rose-400" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-[var(--muted)]">
          Event Settings governance requires ORGANIZER or ADMIN role.
        </p>
        <Link href="/dashboard">
          <Button variant="secondary" size="md">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-[1200px] space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              <Link href="/admin" className="hover:underline">
                Admin Panel
              </Link>
              <span>/</span>
              <span>Event Governance</span>
            </div>
            <h1 className="mt-1 font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              NIRAL Event Settings
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Authoritative PostgreSQL event configuration, schedule parameters, and public lifecycle state.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="secondary" size="sm">
                ← Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Alerts */}
        {error ? (
          <div
            className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
            role="status"
          >
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <p>{success}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="glass glow-ring rounded-3xl p-12 text-center text-sm text-[var(--muted)]">
            Loading authoritative event settings from database...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: General Information */}
            <Panel title="General Information" description="Public event branding, naming, and contact channels">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Event Name</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full"
                    value={eventData.name ?? ""}
                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Event Slug</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full opacity-70"
                    value={eventData.slug ?? ""}
                    disabled
                  />
                  <span className="text-[10px] text-[var(--muted)]">Slug is permanent for API routing</span>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted)]">Tagline</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full"
                    value={eventData.tagline ?? ""}
                    onChange={(e) => setEventData({ ...eventData, tagline: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted)]">Public Description</label>
                  <textarea
                    rows={3}
                    className="field-input mt-1 w-full"
                    value={eventData.publicDescription ?? ""}
                    onChange={(e) => setEventData({ ...eventData, publicDescription: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Organizer Name</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full"
                    value={eventData.organizerName ?? ""}
                    onChange={(e) => setEventData({ ...eventData, organizerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Official Contact Email</label>
                  <input
                    type="email"
                    className="field-input mt-1 w-full"
                    value={eventData.officialEmail ?? ""}
                    onChange={(e) => setEventData({ ...eventData, officialEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Contact Phone (Optional)</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full"
                    value={eventData.contactPhone ?? ""}
                    onChange={(e) => setEventData({ ...eventData, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Website URL</label>
                  <input
                    type="url"
                    className="field-input mt-1 w-full"
                    value={eventData.websiteUrl ?? ""}
                    onChange={(e) => setEventData({ ...eventData, websiteUrl: e.target.value })}
                  />
                </div>
              </div>
            </Panel>

            {/* Section 2: Dates, Schedule & Timezone */}
            <Panel title="Dates & Schedule" description="Confirmed event dates and time configuration">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Event Timezone</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full"
                    value={eventData.timezone ?? "Asia/Kolkata"}
                    onChange={(e) => setEventData({ ...eventData, timezone: e.target.value })}
                  />
                  <span className="text-[10px] text-[var(--muted)]">Standard: Asia/Kolkata (IST)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Participation Mode</label>
                  <select
                    className="field-input mt-1 w-full"
                    value={eventData.eventMode ?? EventMode.HYBRID}
                    onChange={(e) =>
                      setEventData({ ...eventData, eventMode: e.target.value as EventMode })
                    }
                  >
                    <option value={EventMode.HYBRID}>Hybrid (Campus + Online)</option>
                    <option value={EventMode.OFFLINE}>Offline / In-Person Only</option>
                    <option value={EventMode.ONLINE}>Online / Virtual Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Event Start Date</label>
                  <input
                    type="date"
                    className="field-input mt-1 w-full"
                    value={eventData.startsAt ? eventData.startsAt.split("T")[0] : "2026-12-03"}
                    onChange={(e) =>
                      setEventData({
                        ...eventData,
                        startsAt: new Date(`${e.target.value}T00:00:00.000Z`).toISOString(),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Event End Date</label>
                  <input
                    type="date"
                    className="field-input mt-1 w-full"
                    value={eventData.endsAt ? eventData.endsAt.split("T")[0] : "2026-12-04"}
                    onChange={(e) =>
                      setEventData({
                        ...eventData,
                        endsAt: new Date(`${e.target.value}T23:59:59.000Z`).toISOString(),
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="hasExactTimes"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
                    checked={Boolean(eventData.hasExactTimes)}
                    onChange={(e) => setEventData({ ...eventData, hasExactTimes: e.target.checked })}
                  />
                  <label htmlFor="hasExactTimes" className="text-xs text-[var(--muted)]">
                    Exact minute-by-minute session timings are confirmed (If unchecked, public website displays confirmed dates December 3–4 with &quot;Schedule TBA&quot; notice without inventing start hours).
                  </label>
                </div>
              </div>
            </Panel>

            {/* Section 3: Registration & Team Parameters */}
            <Panel title="Registration & Team Governance" description="Seating capacity, team size restrictions, and registration switch">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3 flex items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-500/[0.04] p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Registration Portal Status</p>
                    <p className="text-xs text-[var(--muted)]">
                      Master toggle enabling participant application submissions.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={Boolean(eventData.registrationEnabled)}
                      onChange={(e) =>
                        setEventData({ ...eventData, registrationEnabled: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Max Seating Capacity</label>
                  <input
                    type="number"
                    className="field-input mt-1 w-full"
                    min={1}
                    value={eventData.maxCapacity ?? 1000}
                    onChange={(e) =>
                      setEventData({ ...eventData, maxCapacity: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Min Team Size</label>
                  <input
                    type="number"
                    className="field-input mt-1 w-full"
                    min={1}
                    max={10}
                    value={eventData.minTeamSize ?? 2}
                    onChange={(e) =>
                      setEventData({ ...eventData, minTeamSize: Number(e.target.value) || 2 })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Max Team Size</label>
                  <input
                    type="number"
                    className="field-input mt-1 w-full"
                    min={1}
                    max={10}
                    value={eventData.maxTeamSize ?? 4}
                    onChange={(e) =>
                      setEventData({ ...eventData, maxTeamSize: Number(e.target.value) || 4 })
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-[var(--muted)]">Venue Location Name</label>
                  <input
                    type="text"
                    className="field-input mt-1 w-full"
                    placeholder="e.g. Campus Innovation Hall"
                    value={eventData.venueName ?? ""}
                    onChange={(e) => setEventData({ ...eventData, venueName: e.target.value })}
                  />
                </div>
              </div>
            </Panel>

            {/* Section 4: Lifecycle & Visibility */}
            <Panel title="Event Lifecycle State" description="Defines whether the hackathon is in draft, upcoming, live, or completed mode">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">Lifecycle Phase</label>
                  <select
                    className="field-input mt-1 w-full"
                    value={eventData.status ?? EventStatus.DRAFT}
                    onChange={(e) =>
                      setEventData({ ...eventData, status: e.target.value as EventStatus })
                    }
                  >
                    <option value={EventStatus.DRAFT}>DRAFT — Internal preparation</option>
                    <option value={EventStatus.REGISTRATION_OPEN}>REGISTRATION_OPEN — Accepting participant applications</option>
                    <option value={EventStatus.REGISTRATION_CLOSED}>REGISTRATION_CLOSED — Enrollment cap reached / deadline passed</option>
                    <option value={EventStatus.UPCOMING}>UPCOMING — Final preparations before kickoff</option>
                    <option value={EventStatus.LIVE}>LIVE — Hackathon in session (Dec 3–4)</option>
                    <option value={EventStatus.COMPLETED}>COMPLETED — Judging finalized, winners published</option>
                    <option value={EventStatus.ARCHIVED}>ARCHIVED — Historical record</option>
                  </select>
                </div>
                <div className="flex flex-col justify-center space-y-2">
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={Boolean(eventData.isPublished)}
                      onChange={(e) => setEventData({ ...eventData, isPublished: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500"
                    />
                    Event is Published to Public Website
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={Boolean(eventData.isActive)}
                      onChange={(e) => setEventData({ ...eventData, isActive: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500"
                    />
                    Current Active Event on Platform
                  </label>
                </div>
              </div>
            </Panel>

            {/* Action Bar */}
            <div className="sticky bottom-6 z-20 flex items-center justify-between rounded-2xl border border-sky-400/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="text-xs text-[var(--muted)]">
                All changes are recorded in the PostgreSQL audit log with your organizer identity.
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  size="md"
                  className="cta-primary"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving to Database…" : "Save Event Settings"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
