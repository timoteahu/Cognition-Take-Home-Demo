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

import { CaseActions } from "../../../../components/case-actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn",
  escalated: "info",
  approved: "ok",
  rejected: "danger",
};

const fmtTime = (d: Date) =>
  d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

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
    <AppShell title="KYC Review Queue" hubUrl="/">
      <Link href="/kyc" className="back-link">
        ← back to queue
      </Link>
      <PageHeader
        title={`Case #${kycCase.id} — ${kycCase.customerName}`}
        actions={
          <>
            <CaseActions id={kycCase.id} status={kycCase.status} />
            <Badge tone={STATUS_TONE[kycCase.status] ?? "neutral"}>
              {kycCase.status}
            </Badge>
          </>
        }
      />
      <Card>
        <div className="def-grid">
          <div>
            <div className="def-label">Customer ID</div>
            <div className="def-value">{kycCase.customerId}</div>
          </div>
          <div>
            <div className="def-label">Risk tier</div>
            <div className="def-value">{kycCase.riskTier}</div>
          </div>
          <div>
            <div className="def-label">Status</div>
            <div className="def-value">
              {kycCase.status}
              {kycCase.decidedById ? ` (by ${kycCase.decidedById})` : ""}
            </div>
          </div>
          {kycCase.notes ? (
            <div>
              <div className="def-label">Notes</div>
              <div className="def-value">{kycCase.notes}</div>
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
