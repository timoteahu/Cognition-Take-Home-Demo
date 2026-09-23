import { listAuditEvents, prisma } from "@internal-tools/framework";
import {
  AppShell,
  Badge,
  Card,
  EmptyState,
  Meta,
  PageHeader,
} from "@internal-tools/ui";
import type { BadgeTone } from "@internal-tools/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DisputeActions } from "../../../../components/dispute-actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  open: "warn",
  evidence_submitted: "info",
  won: "ok",
  lost: "danger",
};

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );

const fmtTime = (d: Date) =>
  d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

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
    <AppShell title="Chargeback Manager" hubUrl="/">
      <Link href="/chargebacks" className="back-link">
        ← back to disputes
      </Link>
      <PageHeader
        title={`Dispute #${dispute.id} — ${dispute.cardholderName}`}
        actions={
          <>
            <DisputeActions id={dispute.id} status={dispute.status} />
            <Badge tone={STATUS_TONE[dispute.status] ?? "neutral"}>
              {dispute.status.replaceAll("_", " ")}
            </Badge>
          </>
        }
      />
      <Card>
        <div className="def-grid">
          <div>
            <div className="def-label">Transaction</div>
            <div className="def-value mono">{dispute.transactionId}</div>
          </div>
          <div>
            <div className="def-label">Amount</div>
            <div className="def-value mono">
              {money(dispute.amountCents, dispute.currency)}
            </div>
          </div>
          <div>
            <div className="def-label">Reason</div>
            <div className="def-value">{dispute.reason.replaceAll("_", " ")}</div>
          </div>
          <div>
            <div className="def-label">Status</div>
            <div className="def-value">
              {dispute.status.replaceAll("_", " ")}
              {dispute.resolvedById ? ` (by ${dispute.resolvedById})` : ""}
            </div>
          </div>
          {dispute.deadline ? (
            <div>
              <div className="def-label">Response due</div>
              <div className="def-value">
                {dispute.deadline.toISOString().slice(0, 10)}
              </div>
            </div>
          ) : null}
          {dispute.notes ? (
            <div>
              <div className="def-label">Notes</div>
              <div className="def-value">{dispute.notes}</div>
            </div>
          ) : null}
        </div>
      </Card>

      <h2 className="section-title">
        Audit trail <span className="count">({events.length})</span>
      </h2>
      {events.length === 0 ? (
        <EmptyState title="No recorded activity yet." />
      ) : (
        <div className="stack">
          {events.map((e) => (
            <Card key={e.id} className="card-compact">
              <div className="row-between">
                <span>
                  <strong>{e.action}</strong>{" "}
                  <Badge tone="neutral">{e.actorId}</Badge>
                </span>
                <span className="mono" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                  {fmtTime(e.createdAt)}
                </span>
              </div>
              {e.metadata ? (
                <Meta className="card-desc">
                  <code>{e.metadata}</code>
                </Meta>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
