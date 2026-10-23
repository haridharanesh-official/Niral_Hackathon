import Link from "next/link";
import { Panel } from "@/components/dashboard/panel";

const resources = [
  { title: "IoT architecture primer", tag: "Guide", href: "#" },
  { title: "MQTT cheat sheet", tag: "Reference", href: "#" },
  { title: "Judging rubric 2026", tag: "PDF", href: "#" },
  { title: "Edge ML workshop recording", tag: "Video", href: "#" },
  { title: "FAQ — hardware returns", tag: "FAQ", href: "#" },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Learning Hub
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Resources
        </h1>
        <p className="mt-2 text-sm text-muted">
          Guides, FAQs, and workshop materials — searchable from the top bar.
        </p>
      </div>
      <Panel title="Featured">
        <ul className="space-y-2">
          {resources.map((r) => (
            <li key={r.title}>
              <Link
                href={r.href}
                className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3 text-sm hover:bg-white/5"
              >
                <span className="text-white">{r.title}</span>
                <span className="font-mono text-[10px] text-sky-300">{r.tag}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
