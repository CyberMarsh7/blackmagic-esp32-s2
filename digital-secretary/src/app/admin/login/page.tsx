"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    const resp = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!resp.ok) {
      setError("Invalid credentials");
      return;
    }
    const data = await resp.json();
    localStorage.setItem("admin_token", data.token);
    router.push("/admin/dashboard");
  }

  return (
    <div className="max-w-sm">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <div className="space-y-3">
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="px-4 py-2 bg-sky-600 text-white rounded-lg" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}
