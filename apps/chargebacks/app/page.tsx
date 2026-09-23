import { prisma } from "@internal-tools/framework";
import Link from "next/link";

import { DemoControls } from "../components/demo-controls";

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["open", "evidence_submitted", "won", "lost"];

const money = (cents: number, currency: string) =>
  `${(cents / 100).toFixed(2)} ${currency}`;

export default async function Disputes() {
  const disputes = await prisma.chargeback.findMany({
    orderBy: { createdAt: "desc" },
  });
  const counts = new Map<string, number>();
  for (const d of disputes) counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
  const openExposure = disputes
    .filter((d) => d.status === "open" || d.status === "evidence_submitted")
    .reduce((sum, d) => sum + d.amountCents, 0);

  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Chargeback Manager</h1>
      <p style={{ color: "#666" }}>
        {disputes.length} disputes —{" "}
        {STATUS_ORDER.map((s) => `${counts.get(s) ?? 0} ${s.replace("_", " ")}`).join(", ")}
        {openExposure > 0 ? ` · ${money(openExposure, "USD")} at risk` : ""}
      </p>
      <DemoControls />
      <ul style={{ listStyle: "none", padding: 0 }}>
        {disputes.map((d) => (
          <li
            key={d.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 8,
            }}
          >
            <Link href={`/disputes/${d.id}`} style={{ textDecoration: "none" }}>
              <strong>
                #{d.id} — {d.cardholderName}
              </strong>
            </Link>
            <div style={{ color: "#666", fontSize: 14 }}>
              {d.transactionId} · {money(d.amountCents, d.currency)} · {d.reason} ·{" "}
              {d.status.replace("_", " ")}
              {d.deadline ? ` · due ${d.deadline.toISOString().slice(0, 10)}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
