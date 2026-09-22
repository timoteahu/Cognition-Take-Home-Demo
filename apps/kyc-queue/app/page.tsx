import { prisma } from "@internal-tools/framework";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["pending", "escalated", "approved", "rejected"];

export default async function KycQueue() {
  const cases = await prisma.kycCase.findMany({
    orderBy: { createdAt: "desc" },
  });
  const counts = new Map<string, number>();
  for (const c of cases) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);

  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>KYC Review Queue</h1>
      <p style={{ color: "#666" }}>
        {cases.length} cases —{" "}
        {STATUS_ORDER.map((s) => `${counts.get(s) ?? 0} ${s}`).join(", ")}
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {cases.map((c) => (
          <li
            key={c.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 8,
            }}
          >
            <Link href={`/cases/${c.id}`} style={{ textDecoration: "none" }}>
              <strong>
                #{c.id} — {c.customerName}
              </strong>
            </Link>
            <div style={{ color: "#666", fontSize: 14 }}>
              {c.customerId} · risk {c.riskTier} · {c.status}
              {c.decidedById ? ` · decided by ${c.decidedById}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
