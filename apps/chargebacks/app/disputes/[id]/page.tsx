import { listAuditEvents, prisma } from "@internal-tools/framework";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const money = (cents: number, currency: string) =>
  `${(cents / 100).toFixed(2)} ${currency}`;

export default async function DisputeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dispute = await prisma.chargeback.findUnique({
    where: { id: Number(id) },
  });
  if (!dispute) notFound();

  const events = await listAuditEvents({
    entity: "Chargeback",
    entityId: String(dispute.id),
  });

  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "0 1rem" }}>
      <p>
        <Link href="/" style={{ color: "#666" }}>
          ← back to disputes
        </Link>
      </p>
      <h1>
        Dispute #{dispute.id} — {dispute.cardholderName}
      </h1>
      <dl
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: "12px 16px",
        }}
      >
        <dt style={{ color: "#666", fontSize: 13 }}>Transaction</dt>
        <dd>{dispute.transactionId}</dd>
        <dt style={{ color: "#666", fontSize: 13 }}>Amount</dt>
        <dd>{money(dispute.amountCents, dispute.currency)}</dd>
        <dt style={{ color: "#666", fontSize: 13 }}>Reason</dt>
        <dd>{dispute.reason}</dd>
        <dt style={{ color: "#666", fontSize: 13 }}>Status</dt>
        <dd>
          {dispute.status.replace("_", " ")}
          {dispute.resolvedById ? ` (by ${dispute.resolvedById})` : ""}
        </dd>
        {dispute.deadline ? (
          <>
            <dt style={{ color: "#666", fontSize: 13 }}>Response due</dt>
            <dd>{dispute.deadline.toISOString().slice(0, 10)}</dd>
          </>
        ) : null}
        {dispute.notes ? (
          <>
            <dt style={{ color: "#666", fontSize: 13 }}>Notes</dt>
            <dd>{dispute.notes}</dd>
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
