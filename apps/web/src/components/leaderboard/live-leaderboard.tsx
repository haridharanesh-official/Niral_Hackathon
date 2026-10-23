"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Download,
  MoreVertical,
  Printer,
  Search,
  Sparkles,
} from "lucide-react";
import { SectionState } from "@/components/common/section-state";
import { useAsyncSection } from "@/hooks/use-async-section";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

const tabs = [
  "Overall",
  "Quiz",
  "Games",
  "Innovation",
  "Hardware",
  "Shipments",
] as const;

interface OrderRow {
  id: string;
  productName: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  amount: string;
  status: "New Order" | "In Review" | "Verified";
}

const SAMPLE_ORDERS: OrderRow[] = [
  {
    id: "ID001",
    productName: "CozyNest Sofa, UrbanChic Armchair, RusticCharm Edge…",
    customerName: "Ravi Sharma",
    phone: "9876543210",
    date: "2026-01-15",
    time: "14:30:00",
    amount: "₹8,458,798",
    status: "New Order",
  },
  {
    id: "ID002",
    productName: "SereneStyle Sofa, CloudModular Ottoman, Minimalist Oak…",
    customerName: "Vikram Joshi",
    phone: "3456789012",
    date: "2026-02-20",
    time: "15:00:00",
    amount: "₹5,672,349",
    status: "New Order",
  },
  {
    id: "ID003",
    productName: "UrbanNest Coffee Table, Artisan Walnut Desk Mount…",
    customerName: "Sanjay Kapoor",
    phone: "2345678901",
    date: "2026-03-10",
    time: "15:30:00",
    amount: "₹3,214,567",
    status: "New Order",
  },
  {
    id: "ID004",
    productName: "Timeless Elegance Bookshelf, Nordic Study Console…",
    customerName: "Arjun Mehta",
    phone: "1234567890",
    date: "2026-04-05",
    time: "16:00:00",
    amount: "₹9,876,543",
    status: "New Order",
  },
];

interface PickupRow {
  trackingId: string;
  productName: string;
  customerName: string;
  shipRocketId: string;
  courierTrackingId: string;
  deliveryAddress: string;
  status: "Pending Pickup" | "Dispatched";
}

const SAMPLE_PICKUPS: PickupRow[] = [
  {
    trackingId: "ID001",
    productName: "CozyNest Sofa, UrbanChic Armchair, RusticCharm Coffee Table, ModernEdge B…",
    customerName: "Ravi Sharma",
    shipRocketId: "#A001",
    courierTrackingId: "#B101",
    deliveryAddress: "456 Royal Avenue, Near City Palace, Udaipur, Rajasthan, 313001, India.",
    status: "Pending Pickup",
  },
  {
    trackingId: "ID002",
    productName: "SereneStyle Sofa, Velvet Cushions, Nordic Floating Nightstand…",
    customerName: "Vikram Joshi",
    shipRocketId: "#A001",
    courierTrackingId: "#B102",
    deliveryAddress: "321 Vintage Road, Fort Area, Mumbai, Maharashtra, 400001, India.",
    status: "Pending Pickup",
  },
];

export function LeaderboardTeaser() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overall");
  const [orderSearch, setOrderSearch] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");
  const [activePage, setActivePage] = useState(1);

  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getLeaderboard(tab.toLowerCase()),
    isEmpty: (items) => items.length === 0,
    deps: [tab],
  });

  const [leaderboardRows, setLeaderboardRows] = useState(data ?? []);

  useEffect(() => {
    if (data) setLeaderboardRows(data);
  }, [data]);

  // Live score shuffle
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeaderboardRows((prev) => {
        if (!prev.length) return prev;
        const next = prev.map((row, i) => ({
          ...row,
          xp: row.xp + (i === 0 ? 3 : Math.random() > 0.6 ? 2 : 1),
        }));
        next.sort((a, b) => b.xp - a.xp);
        return next.map((row, index) => ({ ...row, rank: index + 1 }));
      });
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim();
    if (!q) return SAMPLE_ORDERS;
    return SAMPLE_ORDERS.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q),
    );
  }, [orderSearch]);

  const filteredPickups = useMemo(() => {
    const q = pickupSearch.toLowerCase().trim();
    if (!q) return SAMPLE_PICKUPS;
    return SAMPLE_PICKUPS.filter(
      (p) =>
        p.trackingId.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q),
    );
  }, [pickupSearch]);

  return (
    <section id="leaderboard" className="relative scroll-mt-24 py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 space-y-10">
        
        {/* ======================================================== */}
        {/* CARD 1: New Orders Today (DepotNexus Primary Table Card) */}
        {/* ======================================================== */}
        <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
          {/* Card Header: Title + Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div>
              <h2 className="font-sans text-2xl font-bold tracking-tight text-[var(--foreground)]">
                New Orders Today
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Live stream of confirmed orders, equipment bookings, and challenge entries.
              </p>
            </div>

            {/* Pill Search Input with ⌘K badge */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-[var(--muted)]" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order or product"
                className="h-9 w-64 sm:w-80 rounded-full border border-[var(--card-border)] bg-[var(--sand-50)] pl-9 pr-12 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:bg-white"
              />
              <kbd className="pointer-events-none absolute right-3 inline-flex items-center rounded border border-[var(--card-border)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
                ⌘k
              </kbd>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)] font-medium">
                  <th className="pb-3 pr-4 font-medium">Order Id</th>
                  <th className="pb-3 pr-4 font-medium">Product Name</th>
                  <th className="pb-3 pr-4 font-medium">Customer Name</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] text-stone-700 dark:text-stone-300">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="group transition hover:bg-[var(--sand-50)]"
                  >
                    {/* Order ID */}
                    <td className="py-4 pr-4 font-medium text-[var(--foreground)]">
                      {order.id}
                    </td>

                    {/* Product Name */}
                    <td className="py-4 pr-4 max-w-xs truncate font-medium text-[var(--foreground)]">
                      {order.productName}
                    </td>

                    {/* Customer */}
                    <td className="py-4 pr-4">
                      <div className="font-medium text-[var(--foreground)]">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {order.phone}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 pr-4">
                      <div>{order.date}</div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {order.time}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 pr-4 font-semibold text-[var(--foreground)] tabular-nums">
                      {order.amount}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center rounded-full border border-[#86EFAC] bg-[#EAFBF1] dark:bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-[#15803D] dark:text-emerald-400">
                        {order.status}
                      </span>
                    </td>

                    {/* Action: Terracotta Circle with ↗ & ⋮ */}
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-sm transition hover:scale-105 hover:bg-[var(--primary-strong)] cursor-pointer"
                          aria-label={`View details for ${order.id}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)] transition cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DepotNexus Numbered Pagination */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--card-border)] text-xs text-[var(--muted)]">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40 cursor-pointer"
            >
              ← Previous
            </button>

            {/* Circular Page Numbers */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setActivePage(pageNum)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition cursor-pointer",
                    activePage === pageNum
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--foreground)] hover:bg-[var(--sand-100)]",
                  )}
                >
                  {pageNum}
                </button>
              ))}
              <span className="px-1 text-[var(--muted)]">..</span>
              {[8, 9, 10].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setActivePage(pageNum)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition cursor-pointer",
                    activePage === pageNum
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--foreground)] hover:bg-[var(--sand-100)]",
                  )}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActivePage((p) => Math.min(10, p + 1))}
              className="inline-flex items-center gap-1 text-[var(--foreground)] font-medium hover:text-[var(--primary)] cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>


        {/* ======================================================== */}
        {/* CARD 2: Pickups Scheduled for Shiprocket                */}
        {/* ======================================================== */}
        <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
          {/* Card Header: Title + Search + Download Manifest + Print */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">
            <div>
              <h2 className="font-sans text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Pickups Scheduled for Shiprocket
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Hardware dev kit dispatches, 3D lab materials, and student hardware manifests.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Pill Search */}
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-[var(--muted)]" />
                <input
                  type="text"
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  placeholder="Search order or product"
                  className="h-9 w-52 sm:w-64 rounded-full border border-[var(--card-border)] bg-[var(--sand-50)] pl-9 pr-12 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:bg-white"
                />
                <kbd className="pointer-events-none absolute right-3 inline-flex items-center rounded border border-[var(--card-border)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
                  ⌘k
                </kbd>
              </div>

              {/* Download Manifest Pill */}
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-white dark:bg-[#231F1C] px-3.5 text-xs font-medium text-[var(--foreground)] shadow-sm hover:border-stone-400 cursor-pointer"
              >
                <span>Download Manifest</span>
                <Download className="h-3.5 w-3.5 text-[var(--muted)]" />
              </button>

              {/* Print Dropdown Pill */}
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-white dark:bg-[#231F1C] px-3.5 text-xs font-medium text-[var(--foreground)] shadow-sm hover:border-stone-400 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-[var(--muted)]" />
                <span>Print</span>
                <span className="text-[10px] text-[var(--muted)]">⌵</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)] font-medium">
                  <th className="pb-3 pr-4 font-medium">Tracking ID</th>
                  <th className="pb-3 pr-4 font-medium">Product Name</th>
                  <th className="pb-3 pr-4 font-medium">Customer Name</th>
                  <th className="pb-3 pr-4 font-medium">Ship rocket ID</th>
                  <th className="pb-3 pr-4 font-medium">Tracking ID</th>
                  <th className="pb-3 pr-4 font-medium">Delivery Address</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] text-stone-700 dark:text-stone-300">
                {filteredPickups.map((pickup, idx) => (
                  <tr
                    key={`${pickup.trackingId}-${idx}`}
                    className="group transition hover:bg-[var(--sand-50)]"
                  >
                    <td className="py-4 pr-4 font-medium text-[var(--foreground)]">
                      {pickup.trackingId}
                    </td>
                    <td className="py-4 pr-4 max-w-xs truncate font-medium text-[var(--foreground)]">
                      {pickup.productName}
                    </td>
                    <td className="py-4 pr-4 font-medium text-[var(--foreground)]">
                      {pickup.customerName}
                    </td>
                    <td className="py-4 pr-4 font-mono text-[var(--muted)]">
                      {pickup.shipRocketId}
                    </td>
                    <td className="py-4 pr-4 font-mono text-[var(--muted)]">
                      {pickup.courierTrackingId}
                    </td>
                    <td className="py-4 pr-4 max-w-xs truncate text-[var(--muted)]">
                      {pickup.deliveryAddress}
                    </td>
                    <td className="py-4 pr-4">
                      {/* Amber Pill Status like DepotNexus */}
                      <span className="inline-flex items-center rounded-full border border-[#FED7AA] bg-[#FFF8EC] dark:bg-amber-950/40 px-3 py-1 text-[11px] font-medium text-[#B45309] dark:text-amber-400">
                        {pickup.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-sm transition hover:scale-105 hover:bg-[var(--primary-strong)] cursor-pointer"
                          aria-label={`View delivery details for ${pickup.trackingId}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)] transition cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 3: Live Real-Time Leaderboard Standings             */}
        {/* ======================================================== */}
        <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF0EB] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                  <Sparkles className="h-3 w-3" /> Live Standings
                </span>
              </div>
              <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Dynamic Competitor Leaderboard
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Real-time hackathon XP updates as teams commit code, pass test suites, and deliver hardware pitches.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-xs font-medium transition cursor-pointer",
                    tab === t
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "border border-[var(--card-border)] bg-white dark:bg-[#231F1C] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-stone-400",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <SectionState status={status} error={error} onRetry={reload} emptyMessage="No rankings yet.">
              <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] divide-y divide-[var(--card-border)]">
                <AnimatePresence mode="popLayout">
                  {leaderboardRows.slice(0, 8).map((row) => (
                    <motion.div
                      key={`${tab}-${row.name}`}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-[3rem_1fr_6rem_2.5rem] items-center gap-3 px-4 py-3.5 text-xs transition hover:bg-[var(--sand-50)]"
                    >
                      <span className="font-bold text-[var(--primary)]">#{row.rank}</span>
                      <div>
                        <span className="font-semibold text-[var(--foreground)]">{row.name}</span>
                        <span className="ml-2 text-[11px] text-[var(--muted)]">Verified Team</span>
                      </div>
                      <span className="text-right font-mono font-semibold tabular-nums text-[var(--foreground)]">
                        {row.xp.toLocaleString("en-IN")} XP
                      </span>
                      <div className="text-right">
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-sm hover:scale-110 transition cursor-pointer"
                          aria-label={`View team ${row.name}`}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SectionState>
          </div>
        </div>

      </div>
    </section>
  );
}
