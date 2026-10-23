"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAppContent } from "@/store/content-context";
import { Button } from "@/components/ui/button";
import type {
  CheckinParticipant,
  EventTask,
  HardwareInventoryItem,
  JudgingRoundConfig,
} from "@/lib/content-store";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BadgeCheck,
  BellRing,
  Box,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Gavel,
  HelpCircle,
  Layers,
  ListChecks,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

type MainTab =
  | "checkin"
  | "tasks"
  | "analytics"
  | "hardware"
  | "identity"
  | "prizes"
  | "timeline"
  | "judging"
  | "emergency"
  | "faqs";

export default function AdminContentManagerPage() {
  const { content, updateContent, resetToDefault } = useAppContent();
  const [activeTab, setActiveTab] = useState<MainTab>("checkin");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [livePulse, setLivePulse] = useState(true);

  // Form state
  const [formData, setFormData] = useState(content);

  // Keep formData in sync when content loads initially
  useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(content)));
  }, [content]);

  // Pulse animation for simulated live telemetry
  useEffect(() => {
    const timer = setInterval(() => setLivePulse((p) => !p), 2000);
    return () => clearInterval(timer);
  }, []);

  // Checkin terminal state
  const [checkinQuery, setCheckinQuery] = useState("");
  const [checkinFilter, setCheckinFilter] = useState<"ALL" | "CHECKED_IN" | "PENDING">("ALL");
  const [checkinRoleFilter, setCheckinRoleFilter] = useState<string>("ALL");

  // Task filter state
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("ALL");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("ALL");

  // Calculations for KPI Cards
  const checkinList = formData.checkinList || [];
  const checkedInCount = useMemo(
    () => checkinList.filter((p) => p.checkedIn).length,
    [checkinList]
  );
  const totalCheckinCapacity = formData.event?.capacity || 1000;
  const checkinRatePercent = Math.round(
    (checkedInCount / Math.max(1, checkinList.length || 1)) * 100
  );

  const hardwareItems = formData.hardwareInventory || [];
  const totalHardwareUnits = hardwareItems.reduce((acc, h) => acc + h.total, 0);
  const loanedHardwareUnits = hardwareItems.reduce((acc, h) => acc + h.loaned, 0);
  const hardwareLoanRate = Math.round(
    (loanedHardwareUnits / Math.max(1, totalHardwareUnits)) * 100
  );

  const eventTasks = formData.eventTasks || [];
  const pendingTasksCount = eventTasks.filter((t) => t.status !== "DONE").length;
  const criticalTasksCount = eventTasks.filter(
    (t) => t.priority === "CRITICAL" && t.status !== "DONE"
  ).length;

  // Filtered checkin list
  const filteredParticipants = useMemo(() => {
    return checkinList.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(checkinQuery.toLowerCase()) ||
        p.ticketCode.toLowerCase().includes(checkinQuery.toLowerCase()) ||
        p.teamName.toLowerCase().includes(checkinQuery.toLowerCase()) ||
        p.college.toLowerCase().includes(checkinQuery.toLowerCase());

      const matchesStatus =
        checkinFilter === "ALL"
          ? true
          : checkinFilter === "CHECKED_IN"
          ? p.checkedIn
          : !p.checkedIn;

      const matchesRole =
        checkinRoleFilter === "ALL" ? true : p.role === checkinRoleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [checkinList, checkinQuery, checkinFilter, checkinRoleFilter]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return eventTasks.filter((t) => {
      const matchCat =
        taskCategoryFilter === "ALL" ? true : t.category === taskCategoryFilter;
      const matchStatus =
        taskStatusFilter === "ALL" ? true : t.status === taskStatusFilter;
      return matchCat && matchStatus;
    });
  }, [eventTasks, taskCategoryFilter, taskStatusFilter]);

  // Save handler
  const handleSave = async () => {
    setErrorMsg("");
    const ok = await updateContent(formData);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setErrorMsg("Failed to synchronize changes with the live system.");
    }
  };

  // Reset handler
  const handleResetAll = async () => {
    if (
      confirm(
        "Reset all event configurations, check-in rosters, tasks, and content to factory seed defaults?"
      )
    ) {
      await resetToDefault();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Participant Checkin toggle
  const toggleParticipantCheckin = (id: string) => {
    const nextList = checkinList.map((p) => {
      if (p.id === id) {
        const nextStatus = !p.checkedIn;
        return {
          ...p,
          checkedIn: nextStatus,
          checkedInAt: nextStatus
            ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null,
          badgePrinted: nextStatus ? true : p.badgePrinted,
        };
      }
      return p;
    });
    setFormData({ ...formData, checkinList: nextList });
  };

  const toggleBadgePrinted = (id: string) => {
    const nextList = checkinList.map((p) => {
      if (p.id === id) return { ...p, badgePrinted: !p.badgePrinted };
      return p;
    });
    setFormData({ ...formData, checkinList: nextList });
  };

  // Task actions
  const toggleTaskStatus = (id: string) => {
    const nextTasks = eventTasks.map((t) => {
      if (t.id === id) {
        const next =
          t.status === "TODO"
            ? "IN_PROGRESS"
            : t.status === "IN_PROGRESS"
            ? "DONE"
            : "TODO";
        return { ...t, status: next as EventTask["status"] };
      }
      return t;
    });
    setFormData({ ...formData, eventTasks: nextTasks });
  };

  const deleteTask = (id: string) => {
    setFormData({
      ...formData,
      eventTasks: eventTasks.filter((t) => t.id !== id),
    });
  };

  // Hardware adjustment
  const adjustHardware = (id: string, delta: number) => {
    const nextHw = hardwareItems.map((item) => {
      if (item.id === id) {
        const newLoaned = Math.max(0, Math.min(item.total, item.loaned + delta));
        return {
          ...item,
          loaned: newLoaned,
          available: item.total - newLoaned,
        };
      }
      return item;
    });
    setFormData({ ...formData, hardwareInventory: nextHw });
  };

  return (
    <div className="relative min-h-screen bg-[#04060d] text-slate-100 selection:bg-sky-500/30 selection:text-white pb-24">
      {/* Dynamic Circuit & Grid Background */}
      <div className="pointer-events-none fixed inset-0 circuit-grid opacity-25" />
      <div className="pointer-events-none fixed -top-40 right-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/2 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top Header & Telemetry Beacon */}
        <header className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-[#0b1329]/80 to-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-sky-300">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-spin-slow" />
                  HackOS Mission Control v2.6
                </span>

                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300">
                  <span
                    className={`h-2 w-2 rounded-full bg-emerald-400 transition-opacity duration-700 ${
                      livePulse ? "opacity-100 ring-4 ring-emerald-400/30" : "opacity-40"
                    }`}
                  />
                  <span>REAL-TIME ENGINE LIVE</span>
                </div>
              </div>

              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Event Manager & Universal CMS
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Centralized command suite for live attendee check-ins, organizer task logistics,
                hardware tracking, telemetry analytics, and dynamic content synced live across all routes.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-200 transition duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
              >
                <Eye className="h-4 w-4 text-sky-400" />
                <span>Open Public Portal</span>
                <ExternalLink className="h-3 w-3 text-muted" />
              </Link>

              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300 transition duration-200 hover:bg-rose-500/20"
                title="Reset all content to original seed data"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Seed</span>
              </button>

              <Button
                onClick={handleSave}
                className="glow-ring inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-xl transition duration-300 hover:scale-[1.03] hover:brightness-110"
              >
                <Save className="h-4 w-4" />
                <span>Save & Broadcast Live</span>
              </Button>
            </div>
          </div>

          {/* Feedback alerts */}
          {savedSuccess && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-emerald-200 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Mission Control Synced:</span> All edits have been pushed
                to server memory and immediately broadcast to all active participant sessions!
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-4 text-rose-200 backdrop-blur-md">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div className="text-sm">{errorMsg}</div>
            </div>
          )}
        </header>

        {/* Real-time KPI Statistics Ribbon */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Check-in Terminal Status */}
          <div className="group relative overflow-hidden rounded-3xl border border-sky-400/20 bg-slate-900/50 p-5 backdrop-blur-md transition hover:border-sky-400/40 hover:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-sky-400">
                Check-in Terminal
              </span>
              <UserCheck className="h-5 w-5 text-sky-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-white">
                {checkedInCount}
              </span>
              <span className="text-xs text-muted">/ {checkinList.length} Roster</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-muted mb-1">
                <span>Attendance Rate</span>
                <span className="font-mono text-sky-300 font-semibold">{checkinRatePercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, checkinRatePercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Organizer Tasks & Milestones */}
          <div className="group relative overflow-hidden rounded-3xl border border-amber-400/20 bg-slate-900/50 p-5 backdrop-blur-md transition hover:border-amber-400/40 hover:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
                Operations Tasks
              </span>
              <ListChecks className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-white">
                {pendingTasksCount}
              </span>
              <span className="text-xs text-muted">Tasks Pending</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">Critical Open:</span>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                  criticalTasksCount > 0
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {criticalTasksCount} Critical
              </span>
            </div>
          </div>

          {/* Card 3: Hardware Desk Utilization */}
          <div className="group relative overflow-hidden rounded-3xl border border-violet-400/20 bg-slate-900/50 p-5 backdrop-blur-md transition hover:border-violet-400/40 hover:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-violet-400">
                Hardware Lab Kits
              </span>
              <Cpu className="h-5 w-5 text-violet-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-white">
                {loanedHardwareUnits}
              </span>
              <span className="text-xs text-muted">/ {totalHardwareUnits} Loaned</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-muted mb-1">
                <span>Stock Out Rate</span>
                <span className="font-mono text-violet-300 font-semibold">{hardwareLoanRate}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, hardwareLoanRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Total Prize & Valuation */}
          <div className="group relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-slate-900/50 p-5 backdrop-blur-md transition hover:border-emerald-400/40 hover:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                Prize Bounty
              </span>
              <Award className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-white">
                ₹{((formData.event?.prizePool || 500000) / 100000).toFixed(1)}L
              </span>
              <span className="text-xs text-muted">Total Grants</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Rounds Status:</span>
              <span className="font-mono text-emerald-300 font-semibold">
                {formData.judgingConfig?.currentRound?.replace(/_/g, " ") || "ROUND 1"}
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex overflow-x-auto gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2 backdrop-blur-md">
          {[
            { id: "checkin", label: "Check-in Terminal", icon: UserCheck, count: checkedInCount },
            { id: "tasks", label: "Event Task Manager", icon: ListChecks, count: pendingTasksCount },
            { id: "hardware", label: "Hardware Inventory", icon: Box, count: hardwareItems.length },
            { id: "analytics", label: "Detailed Statistics", icon: TrendingUp },
            { id: "identity", label: "Event & Branding", icon: Sliders },
            { id: "prizes", label: "Prize Pool", icon: Award },
            { id: "timeline", label: "Timeline Schedule", icon: Calendar },
            { id: "judging", label: "Judging & Rubric", icon: Gavel },
            {
              id: "emergency",
              label: "Banners & Emergency",
              icon: BellRing,
              alert: formData.emergencyBanner?.enabled,
            },
            { id: "faqs", label: "FAQs Repository", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                  active
                    ? "border border-sky-400/40 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-sky-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      active ? "bg-sky-400/30 text-sky-200" : "bg-black/40 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.alert && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TAB 1: EVENT OPERATIONS & ATTENDEE CHECK-IN TERMINAL
            ========================================================================= */}
        {activeTab === "checkin" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
                  <UserCheck className="h-6 w-6 text-sky-400" />
                  Attendee & Team Check-in Terminal
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Search participant by ticket ID, name, or team. Mark check-ins, record arrival time, and trigger physical badge printing.
                </p>
              </div>

              {/* Quick Add Attendee Button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const newCode = `HOS-${Math.floor(1000 + Math.random() * 9000)}`;
                  const newParticipant: CheckinParticipant = {
                    id: `chk-${Date.now()}`,
                    ticketCode: newCode,
                    name: "New Attendee",
                    email: "attendee@hackos.app",
                    teamName: "Solo / Unassigned",
                    track: "Industrial Automation",
                    college: "Walk-in Registration",
                    checkedIn: true,
                    checkedInAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    badgePrinted: false,
                    dietary: "Standard",
                    tshirtSize: "L",
                    role: "PARTICIPANT",
                  };
                  setFormData({
                    ...formData,
                    checkinList: [newParticipant, ...checkinList],
                  });
                }}
                className="self-start sm:self-auto border border-sky-400/30 text-sky-300 hover:bg-sky-500/10"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Quick Add Attendee
              </Button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search by attendee name, ticket code (e.g. HOS-9401), team, or college..."
                  value={checkinQuery}
                  onChange={(e) => setCheckinQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
                  {(["ALL", "CHECKED_IN", "PENDING"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCheckinFilter(mode)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                        checkinFilter === mode
                          ? "bg-sky-500 text-white shadow"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      {mode === "ALL" ? "All" : mode === "CHECKED_IN" ? "Checked In" : "Pending"}
                    </button>
                  ))}
                </div>

                <select
                  value={checkinRoleFilter}
                  onChange={(e) => setCheckinRoleFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="PARTICIPANT">Participants</option>
                  <option value="TEAM_LEADER">Team Leaders</option>
                  <option value="MENTOR">Mentors</option>
                  <option value="JUDGE">Judges</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            {/* Attendees Table */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 bg-white/[0.03] font-mono text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-5 py-3.5">Ticket</th>
                      <th className="px-5 py-3.5">Attendee / Team</th>
                      <th className="px-5 py-3.5">Track / College</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Check-in Status</th>
                      <th className="px-5 py-3.5">Badge & Swag</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-muted">
                          No attendees match your search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => (
                        <tr
                          key={p.id}
                          className={`transition hover:bg-white/[0.02] ${
                            p.checkedIn ? "bg-sky-500/[0.02]" : ""
                          }`}
                        >
                          <td className="px-5 py-4 font-mono font-bold text-sky-300">
                            {p.ticketCode}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-muted text-[11px]">{p.teamName} · {p.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-slate-200">{p.track}</span>
                            <div className="text-muted text-[11px]">{p.college}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                p.role === "TEAM_LEADER"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : p.role === "MENTOR"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : p.role === "JUDGE"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                              }`}
                            >
                              {p.role}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {p.checkedIn ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Checked In ({p.checkedInAt || "09:00 AM"})</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Pending Arrival</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleBadgePrinted(p.id)}
                                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono transition ${
                                  p.badgePrinted
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-black/30 text-slate-500 hover:text-white"
                                }`}
                              >
                                <Printer className="h-3 w-3" />
                                {p.badgePrinted ? "Badge Printed" : "Print Badge"}
                              </button>
                              <span className="text-[11px] text-muted">T-Shirt: {p.tshirtSize}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              size="sm"
                              variant={p.checkedIn ? "secondary" : "primary"}
                              onClick={() => toggleParticipantCheckin(p.id)}
                              className={`h-7 px-3 text-xs ${
                                p.checkedIn
                                  ? "border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                                  : "bg-sky-500 text-white"
                              }`}
                            >
                              {p.checkedIn ? "Undo" : "Check In"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: EVENT ORGANIZER TASK & MILESTONE BOARD
            ========================================================================= */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
                  <ListChecks className="h-6 w-6 text-amber-400" />
                  Organizer Operations Board
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Coordinate logistics, Wi-Fi infra, hardware desk staffing, mentor matching, and catering.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const newTask: EventTask = {
                    id: `task-${Date.now()}`,
                    title: "New Operations Milestone",
                    category: "Venue & Stage",
                    priority: "HIGH",
                    status: "TODO",
                    assignee: "Unassigned",
                    dueTime: "12:00 PM",
                  };
                  setFormData({
                    ...formData,
                    eventTasks: [newTask, ...eventTasks],
                  });
                }}
                className="border border-amber-400/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Task
              </Button>
            </div>

            {/* Task Filters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={taskCategoryFilter}
                onChange={(e) => setTaskCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Venue & Stage">Venue & Stage</option>
                <option value="Hardware Desk">Hardware Desk</option>
                <option value="Catering & Logistics">Catering & Logistics</option>
                <option value="Mentor Clinics">Mentor Clinics</option>
                <option value="Judging">Judging</option>
                <option value="Network & Infra">Network & Infra</option>
              </select>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>
            </div>

            {/* Tasks Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3 backdrop-blur-md transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                        task.priority === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : task.priority === "HIGH"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-white leading-snug">
                    {task.title}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted pt-2 border-t border-white/5">
                    <span>{task.category}</span>
                    <span className="font-mono text-slate-300">{task.dueTime}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-sky-300/80 font-mono">@{task.assignee}</span>
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        task.status === "DONE"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : task.status === "IN_PROGRESS"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-black/40 text-slate-400 border border-white/10 hover:text-white"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      <span>{task.status.replace("_", " ")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: HARDWARE INVENTORY & LAB LOANS
            ========================================================================= */}
        {activeTab === "hardware" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
                  <Box className="h-6 w-6 text-violet-400" />
                  Hardware Lab Loan & Inventory Manager
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Keep track of edge MCUs, sensor kits, LoRa nodes, and test equipment issued to student teams.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const newItem: HardwareInventoryItem = {
                    id: `hw-${Date.now()}`,
                    name: "New Sensor Module Kit",
                    sku: "MOD-SENS-01",
                    category: "Sensors",
                    total: 20,
                    loaned: 0,
                    available: 20,
                    depositRequired: false,
                  };
                  setFormData({
                    ...formData,
                    hardwareInventory: [newItem, ...hardwareItems],
                  });
                }}
                className="border border-violet-400/30 text-violet-300 hover:bg-violet-500/10"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Hardware SKU
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hardwareItems.map((item) => {
                const percent = Math.round((item.loaned / Math.max(1, item.total)) * 100);
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-sky-400 uppercase tracking-widest">
                        {item.sku}
                      </span>
                      {item.depositRequired && (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-mono">
                          ID Deposit Req.
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display text-base font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-muted">{item.category}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-muted">Loaned: {item.loaned}</span>
                        <span className="text-emerald-400">Available: {item.available}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-xs text-muted font-mono">Total Units: {item.total}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => adjustHardware(item.id, -1)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10 font-bold"
                          title="Return 1 unit"
                        >
                          - Return
                        </button>
                        <button
                          onClick={() => adjustHardware(item.id, 1)}
                          className="rounded-lg bg-sky-500 px-2.5 py-1 text-xs text-white hover:bg-sky-400 font-bold"
                          title="Loan out 1 unit"
                        >
                          + Issue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: DETAILED STATISTICAL TELEMETRY & BREAKDOWNS
            ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
                <TrendingUp className="h-6 w-6 text-sky-400" />
                Live Hackathon Telemetry & Track Breakdown
              </h2>
              <p className="mt-1 text-xs text-muted">
                Detailed breakdowns of team participation tracks, check-in velocity, and engagement metrics.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Track Participation Breakdown */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-5 backdrop-blur-md">
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sky-400" />
                  Track Distribution
                </h3>

                <div className="space-y-4">
                  {(formData.trackDistribution || []).map((t) => (
                    <div key={t.track} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-white">{t.track}</span>
                        <span className="font-mono text-muted">
                          {t.teamsCount} teams · {t.participantsCount} hackers
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (t.teamsCount / 200) * 100)}%`,
                            backgroundColor: t.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Velocity Histogram */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-5 backdrop-blur-md">
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Check-in Velocity (Hourly Flow)
                </h3>

                <div className="flex items-end justify-between gap-4 h-48 pt-6 border-b border-white/10 pb-2">
                  {(formData.checkinVelocity || []).map((v) => (
                    <div key={v.hour} className="flex flex-col items-center flex-1 h-full justify-end">
                      <span className="text-[11px] font-mono text-sky-300 font-bold mb-1">{v.count}</span>
                      <div
                        className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-sky-500/40 to-sky-400 transition-all hover:brightness-125"
                        style={{ height: `${(v.count / 260) * 100}%` }}
                      />
                      <span className="text-[10px] text-muted font-mono mt-2">{v.hour}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted text-center">Peak arrival window: 08:30 AM – 09:30 AM</p>
              </div>
            </div>

            {/* Editable Stats Counters */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-white">
                Public Counter Values (Live Landing Page API)
              </h3>
              <p className="text-xs text-muted">
                These values are served directly to `/api/home/statistics` and feed the animated counters on the home page.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-2">
                {[
                  { key: "participants", label: "Registered Participants" },
                  { key: "teams", label: "Formed Teams" },
                  { key: "mentors", label: "Available Mentors" },
                  { key: "judges", label: "Confirmed Judges" },
                  { key: "sponsors", label: "Corporate Partners" },
                  { key: "countries", label: "Countries Represented" },
                  { key: "prizePool", label: "Prize Allocation (₹)" },
                  { key: "visitors", label: "Portal Visitors" },
                ].map((item) => (
                  <div key={item.key} className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <label className="text-xs text-muted block mb-1">{item.label}</label>
                    <input
                      type="number"
                      value={(formData.statistics as any)?.[item.key] ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statistics: {
                            ...formData.statistics,
                            [item.key]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-base font-mono font-bold text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: EVENT IDENTITY & HERO COPY
            ========================================================================= */}
        {activeTab === "identity" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-sky-400" /> Hackathon Branding
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  App / Brand Name (Reflected across navigation, footer, metadata)
                </label>
                <input
                  type="text"
                  value={formData.event?.name ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event: { ...formData.event, name: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tagline (Main Hero Headline)
                </label>
                <input
                  type="text"
                  value={formData.event?.tagline ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event: { ...formData.event, tagline: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Venue / Location Format
                </label>
                <input
                  type="text"
                  value={formData.event?.venue ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event: { ...formData.event, venue: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Detailed Description (About Section)
                </label>
                <textarea
                  rows={4}
                  value={formData.event?.description ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event: { ...formData.event, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-400" /> Timing & Target Clock
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Starts At (ISO format)
                </label>
                <input
                  type="text"
                  value={formData.event?.startsAt ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event: { ...formData.event, startsAt: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
                <span className="text-[11px] text-muted">
                  The live countdown timer on the hero computes against this date.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Ends At
                </label>
                <input
                  type="text"
                  value={formData.event?.endsAt ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      event: { ...formData.event, endsAt: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.event?.capacity ?? 1000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event: {
                          ...formData.event,
                          capacity: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Filled Spots
                  </label>
                  <input
                    type="number"
                    value={formData.event?.filled ?? 720}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event: {
                          ...formData.event,
                          filled: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: PRIZE POOL BUILDER
            ========================================================================= */}
        {activeTab === "prizes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                  <Award className="h-6 w-6 text-sky-400" />
                  Prize Pool Categories & Grants
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Edit prize amounts, special perks, and highlighted cards displayed on the public landing page.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setFormData({
                    ...formData,
                    prizes: [
                      ...(formData.prizes || []),
                      {
                        place: "Track Innovation Award",
                        amount: "₹35,000",
                        perks: ["Cloud credits", "Fast-track interview"],
                        highlight: false,
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Prize Tier
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(formData.prizes || []).map((prize, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 space-y-3 backdrop-blur-md transition ${
                    prize.highlight
                      ? "border-sky-400/40 bg-sky-500/[0.08] shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                      : "border-white/10 bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase text-sky-400">
                      Tier #{idx + 1}
                    </span>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          prizes: formData.prizes.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Place / Title</label>
                    <input
                      type="text"
                      value={prize.place}
                      onChange={(e) => {
                        const next = [...formData.prizes];
                        next[idx].place = e.target.value;
                        setFormData({ ...formData, prizes: next });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Amount</label>
                    <input
                      type="text"
                      value={prize.amount}
                      onChange={(e) => {
                        const next = [...formData.prizes];
                        next[idx].amount = e.target.value;
                        setFormData({ ...formData, prizes: next });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-base font-mono font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Perks (comma separated)</label>
                    <input
                      type="text"
                      value={prize.perks.join(", ")}
                      onChange={(e) => {
                        const next = [...formData.prizes];
                        next[idx].perks = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setFormData({ ...formData, prizes: next });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={prize.highlight}
                        onChange={(e) => {
                          const next = [...formData.prizes];
                          next[idx].highlight = e.target.checked;
                          setFormData({ ...formData, prizes: next });
                        }}
                      />
                      Highlight Card (Glow styling)
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: TIMELINE & SCHEDULE
            ========================================================================= */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-sky-400" />
                  Event Timeline & Checkpoints
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Milestones, schedules, venues, and calendar (.ics) exportable schedule points.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setFormData({
                    ...formData,
                    timeline: [
                      ...(formData.timeline || []),
                      {
                        title: "New Session",
                        date: "Aug 16, 2026",
                        time: "14:00 IST",
                        venue: "Main Stage",
                        description: "Keynote presentation and demo.",
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Checkpoint
              </Button>
            </div>

            <div className="space-y-4">
              {(formData.timeline || []).map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase text-sky-400">
                      Milestone #{idx + 1}
                    </span>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          timeline: formData.timeline.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs text-muted block mb-1">Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const next = [...formData.timeline];
                          next[idx].title = e.target.value;
                          setFormData({ ...formData, timeline: next });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Date & Time</label>
                      <input
                        type="text"
                        value={`${item.date} · ${item.time}`}
                        onChange={(e) => {
                          const next = [...formData.timeline];
                          const [d, t] = e.target.value.split("·").map((s) => s.trim());
                          next[idx].date = d || item.date;
                          if (t) next[idx].time = t;
                          setFormData({ ...formData, timeline: next });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Venue</label>
                      <input
                        type="text"
                        value={item.venue}
                        onChange={(e) => {
                          const next = [...formData.timeline];
                          next[idx].venue = e.target.value;
                          setFormData({ ...formData, timeline: next });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const next = [...formData.timeline];
                        next[idx].description = e.target.value;
                        setFormData({ ...formData, timeline: next });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: JUDGING ROUNDS & RUBRIC WEIGHTS
            ========================================================================= */}
        {activeTab === "judging" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                <Gavel className="h-6 w-6 text-purple-400" />
                Judging Control Room & Rubric Calibration
              </h2>
              <p className="mt-1 text-xs text-muted">
                Control current evaluation stage, lock/unlock scoring sheets, and configure rubric weight distributions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
                <h3 className="font-display text-base font-bold text-white">Current Round Stage</h3>

                <div>
                  <label className="text-xs text-muted block mb-1">Active Evaluation Stage</label>
                  <select
                    value={formData.judgingConfig?.currentRound || "ROUND_1_SCREENING"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        judgingConfig: {
                          ...formData.judgingConfig,
                          currentRound: e.target.value as any,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="ROUND_1_SCREENING">Round 1 · Initial Screening</option>
                    <option value="SEMI_FINALS">Semi-Finals · Demo Presentation</option>
                    <option value="GRAND_FINALE">Grand Finale · Jury Pitches</option>
                    <option value="COMPLETED">Evaluation Completed · Scores Final</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
                  <div>
                    <span className="font-medium text-white text-sm">Lock All Scorecards</span>
                    <p className="text-xs text-muted">Prevent further judge edits or submissions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.judgingConfig?.isScoringLocked || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        judgingConfig: {
                          ...formData.judgingConfig,
                          isScoringLocked: e.target.checked,
                        },
                      })
                    }
                    className="h-5 w-5 rounded border-white/20 text-sky-500"
                  />
                </div>
              </div>

              {/* Rubric Weights */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3 backdrop-blur-md">
                <h3 className="font-display text-base font-bold text-white">Scorecard Rubric Weights (%)</h3>

                {[
                  { key: "innovation", label: "Innovation & Uniqueness" },
                  { key: "technicalDepth", label: "Technical Depth & Complexity" },
                  { key: "scalability", label: "Scalability & Architecture" },
                  { key: "presentation", label: "UI / UX & Pitch Delivery" },
                  { key: "businessImpact", label: "Business Viability & Impact" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{item.label}</span>
                    <input
                      type="number"
                      value={(formData.judgingConfig?.rubricWeights as any)?.[item.key] ?? 20}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          judgingConfig: {
                            ...formData.judgingConfig,
                            rubricWeights: {
                              ...formData.judgingConfig?.rubricWeights,
                              [item.key]: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-right font-mono text-xs text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 9: EMERGENCY & ANNOUNCEMENTS
            ========================================================================= */}
        {activeTab === "emergency" && (
          <div className="space-y-6">
            {/* Urgent Sticky Banner */}
            <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-slate-950/60 p-6 space-y-4 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-rose-400 animate-bounce" />
                    High-Priority Emergency Banner
                  </h3>
                  <p className="text-xs text-rose-200/80">
                    Immediately locks an unmistakable warning ribbon to the top of all public and dashboard views.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emergencyBanner?.enabled ?? false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyBanner: {
                          ...formData.emergencyBanner,
                          enabled: e.target.checked,
                          message: formData.emergencyBanner?.message || "",
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-mono">Alert Notice Message</label>
                <textarea
                  rows={2}
                  value={formData.emergencyBanner?.message ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyBanner: {
                        ...formData.emergencyBanner,
                        enabled: formData.emergencyBanner?.enabled ?? false,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Schedule Change — Finals presentation moved to Auditorium A at 16:00 IST."
                  className="w-full rounded-xl border border-rose-500/40 bg-black/60 px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Announcements Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white">Event Broadcast Feed</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      announcements: [
                        {
                          id: `ann-${Date.now()}`,
                          title: "New Announcement",
                          message: "Announcement details here.",
                          priority: "normal",
                          publishedAt: new Date().toISOString(),
                        },
                        ...(formData.announcements || []),
                      ],
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Broadcast Announcement
                </Button>
              </div>

              {(formData.announcements || []).map((ann, idx) => (
                <div
                  key={ann.id || idx}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase text-sky-400">
                      Announcement #{idx + 1}
                    </span>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          announcements: formData.announcements.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={ann.title}
                    onChange={(e) => {
                      const next = [...formData.announcements];
                      next[idx].title = e.target.value;
                      setFormData({ ...formData, announcements: next });
                    }}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-semibold text-white"
                  />
                  <textarea
                    rows={2}
                    value={ann.message}
                    onChange={(e) => {
                      const next = [...formData.announcements];
                      next[idx].message = e.target.value;
                      setFormData({ ...formData, announcements: next });
                    }}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 10: FAQS REPOSITORY
            ========================================================================= */}
        {activeTab === "faqs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-sky-400" />
                  Frequently Asked Questions (FAQ) Repository
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Questions and answers fed directly to the public FAQ accordion on the home page.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setFormData({
                    ...formData,
                    faqs: [
                      ...(formData.faqs || []),
                      {
                        id: `faq-${Date.now()}`,
                        question: "New Hackathon FAQ?",
                        answer: "Detailed answer goes here.",
                        category: "general",
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {(formData.faqs || []).map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase text-sky-400">
                      FAQ #{idx + 1}
                    </span>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          faqs: formData.faqs.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Question</label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const next = [...formData.faqs];
                        next[idx].question = e.target.value;
                        setFormData({ ...formData, faqs: next });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Answer</label>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => {
                        const next = [...formData.faqs];
                        next[idx].answer = e.target.value;
                        setFormData({ ...formData, faqs: next });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Quick Action Footer */}
        <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:underline"
          >
            <span>← Return to Public Homepage</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetAll}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              Reset Seed
            </button>
            <Button
              onClick={handleSave}
              className="glow-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:brightness-110"
            >
              <Save className="h-4 w-4" /> Save & Push Live
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
