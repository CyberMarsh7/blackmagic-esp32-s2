"use client";

import { useEffect, useState } from "react";

type Stats = { visitors: number; messages: number; unreadMessages: number };

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  useEffect(() => {
    async function load() {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const [dash, statusResp] = await Promise.all([
        fetch("/api/admin/dashboard", { headers }),
        fetch("/api/status", { headers }),
      ]);
      if (dash.ok) setStats(await dash.json());
      if (statusResp.ok) {
        const s = await statusResp.json();
        setIsAvailable(Boolean(s.isAvailable));
        setManualOverride(Boolean(s.manualOverride));
      }
    }
    load();
  }, [token]);

  async function saveStatus() {
    if (!token) return;
    setSaving(true);
    await fetch("/api/status/manual", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ manualOverride, isAvailable }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Visitors" value={stats?.visitors ?? 0} />
          <StatCard label="Messages" value={stats?.messages ?? 0} />
          <StatCard label="Unread" value={stats?.unreadMessages ?? 0} />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <h3 className="font-semibold">Status</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={manualOverride} onChange={(e) => setManualOverride(e.target.checked)} />
            Manual override
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            Available
          </label>
          <button className="px-3 py-2 rounded bg-sky-600 text-white text-sm" onClick={saveStatus} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
