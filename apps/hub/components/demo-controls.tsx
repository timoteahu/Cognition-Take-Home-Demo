"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DISPUTE_NAMES,
  KYC_NAMES,
  REASONS,
  RISK_TIERS,
} from "../lib/demo-data";

// Demo-only token — the framework's seeded builder credential.
const DEV_TOKEN = "dev-builder-token";

const TOOL_CONFIG = {
  kyc: {
    addLabel: "Add random case",
    endpoint: "/api/cases",
    resetPath: "/api/demo/reset/kyc",
    randomBody: () => ({
      customerId: `C-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: KYC_NAMES[Math.floor(Math.random() * KYC_NAMES.length)],
      riskTier: RISK_TIERS[Math.floor(Math.random() * RISK_TIERS.length)],
    }),
  },
  chargebacks: {
    addLabel: "Add random dispute",
    endpoint: "/api/disputes",
    resetPath: "/api/demo/reset/chargebacks",
    randomBody: () => ({
      transactionId: `txn_${Math.random().toString(16).slice(2, 8)}`,
      cardholderName:
        DISPUTE_NAMES[Math.floor(Math.random() * DISPUTE_NAMES.length)],
      amountCents: Math.floor(500 + Math.random() * 49500),
      reason: REASONS[Math.floor(Math.random() * REASONS.length)],
      deadline: new Date(
        Date.now() + (3 + Math.floor(Math.random() * 10)) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }),
  },
} as const;

export function DemoControls({ tool }: { tool: keyof typeof TOOL_CONFIG }) {
  const config = TOOL_CONFIG[tool];
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<Response>) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fn();
      const body = await res.json().catch(() => ({}));
      setMessage(
        res.ok
          ? `${action} done`
          : `${action} failed: ${body.error ?? res.status}`,
      );
    } catch (e) {
      setMessage(
        `${action} failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  const addRandom = () =>
    run(config.addLabel, () =>
      fetch(config.endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${DEV_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(config.randomBody()),
      }),
    );

  const reset = () =>
    run("Reset demo data", () =>
      fetch(config.resetPath, {
        method: "POST",
        headers: { authorization: `Bearer ${DEV_TOKEN}` },
      }),
    );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <button
        className="btn btn-primary"
        onClick={addRandom}
        disabled={busy !== null}
      >
        {config.addLabel}
      </button>
      <button
        className="btn btn-secondary"
        onClick={reset}
        disabled={busy !== null}
      >
        Reset demo data
      </button>
      {(busy || message) && (
        <span style={{ color: "var(--fg-muted)", fontSize: 13 }}>
          {busy ? `${busy}…` : message}
        </span>
      )}
    </div>
  );
}
