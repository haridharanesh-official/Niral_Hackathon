"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [density, setDensity] = useState("comfortable");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const layout = JSON.parse(
        localStorage.getItem("hackos.dashboard.widgets") ?? "{}",
      ) as { density?: string };
      if (layout.density) setDensity(layout.density);
    } catch {
      /* ignore */
    }
  }, []);

  async function save() {
    localStorage.setItem(
      "hackos.dashboard.widgets",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("hackos.dashboard.widgets") ?? "{}"),
        density,
      }),
    );

    if (session?.accessToken) {
      await fetch(`${apiUrl}/api/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationPrefs: {
            email: emailNotifs,
            push: pushNotifs,
          },
        }),
      });
    }
    setMessage("Preferences saved");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Settings
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Dashboard preferences
        </h1>
      </div>

      <Panel title="Personalization">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Dashboard density</span>
          <select
            className="field-input"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <p className="mt-3 text-xs text-muted">
          Theme and language are controlled from the top navigation. Widget
          layout is customized on the Overview page.
        </p>
      </Panel>

      <Panel title="Notification preferences">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={emailNotifs}
            onChange={(e) => setEmailNotifs(e.target.checked)}
          />
          Email notifications
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={pushNotifs}
            onChange={(e) => setPushNotifs(e.target.checked)}
          />
          Push notifications (future)
        </label>
        <Button className="mt-4" size="sm" onClick={() => void save()}>
          Save preferences
        </Button>
        {message ? (
          <p className="mt-3 text-sm text-sky-200" role="status">
            {message}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
