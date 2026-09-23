"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Demo-only token — the framework's seeded builder credential.
const DEV_TOKEN = "dev-builder-token";

const DECISIONS = [
  { key: "approve", label: "Approve", className: "btn btn-primary" },
  { key: "reject", label: "Reject", className: "btn btn-secondary" },
  { key: "escalate", label: "Escalate", className: "btn btn-secondary" },
] as const;

export function CaseActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "approved" || status === "rejected") return null;

  async function decide(decision: string) {
    setBusy(decision);
    setMessage(null);
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${DEV_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ decision }),
      });
      const body = await res.json().catch(() => ({}));
      setMessage(
        res.ok ? null : `Decision failed: ${body.error ?? res.status}`,
      );
    } catch (e) {
      setMessage(
        `Decision failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {DECISIONS.map((d) => (
        <button
          key={d.key}
          className={d.className}
          onClick={() => decide(d.key)}
          disabled={busy !== null}
        >
          {busy === d.key ? `${d.label}…` : d.label}
        </button>
      ))}
      {message && (
        <span style={{ color: "var(--fg-muted)", fontSize: 13 }}>{message}</span>
      )}
    </div>
  );
}
