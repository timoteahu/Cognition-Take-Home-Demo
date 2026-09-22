import { listAuditEvents, prisma } from "@internal-tools/framework";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KycCaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kycCase = await prisma.kycCase.findUnique({
    where: { id: Number(id) },
  });
  if (!kycCase) notFound();

  const events = await listAuditEvents({
    entity: "KycCase",
    entityId: String(kycCase.id),
  });

  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "0 1rem" }}>
      <p>
        <Link href="/" style={{ color: "#666" }}>
          ← back to queue
        </Link>
      </p>
      <h1>
        Case #{kycCase.id} — {kycCase.customerName}
      </h1>
      <dl
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: "12px 16px",
        }}
      >
        <dt style={{ color: "#666", fontSize: 13 }}>Customer ID</dt>
        <dd>{kycCase.customerId}</dd>
        <dt style={{ color: "#666", fontSize: 13 }}>Risk tier</dt>
        <dd>{kycCase.riskTier}</dd>
        <dt style={{ color: "#666", fontSize: 13 }}>Status</dt>
        <dd>
          {kycCase.status}
          {kycCase.decidedById ? ` (by ${kycCase.decidedById})` : ""}
        </dd>
        {kycCase.notes ? (
          <>
            <dt style={{ color: "#666", fontSize: 13 }}>Notes</dt>
            <dd>{kycCase.notes}</dd>
          </>
        ) : null}
      </dl>

      <h2>Audit trail</h2>
      {events.length === 0 ? (
        <p style={{ color: "#666" }}>No recorded activity yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((e) => (
            <li
              key={e.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "10px 16px",
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              <strong>{e.action}</strong> by {e.actorId}
              <div style={{ color: "#666", fontSize: 13 }}>
                {e.createdAt.toISOString()}
                {e.metadata ? ` — ${e.metadata}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
