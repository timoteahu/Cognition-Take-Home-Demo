"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Demo-only token — the framework's seeded builder credential.
const DEV_TOKEN = "dev-builder-token";

const RESOLVED = new Set(["won", "lost"]);

export function DisputeActions({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (RESOLVED.has(status)) return null;

  async function act(action: string) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/disputes/${id}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${DEV_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({}));
      setMessage(
        res.ok ? null : `Action failed: ${body.error ?? res.status}`,
      );
    } catch (e) {
      setMessage(
        `Action failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  const buttons = [
    ...(status === "open"
      ? [
          {
            key: "submit_evidence",
            label: "Submit evidence",
            className: "btn btn-secondary",
          },
        ]
      : []),
    { key: "win", label: "Mark won", className: "btn btn-primary" },
    { key: "lose", label: "Mark lost", className: "btn btn-secondary" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {buttons.map((b) => (
        <button
          key={b.key}
          className={b.className}
          onClick={() => act(b.key)}
          disabled={busy !== null}
        >
          {busy === b.key ? `${b.label}…` : b.label}
        </button>
      ))}
      {message && (
        <span style={{ color: "var(--fg-muted)", fontSize: 13 }}>{message}</span>
      )}
    </div>
  );
}
