import { prisma } from "@internal-tools/framework";
import {
  AppShell,
  Badge,
  Card,
  Meta,
  PageHeader,
  StatGrid,
} from "@internal-tools/ui";
import type { BadgeTone } from "@internal-tools/ui";
import Link from "next/link";

import { DemoControls } from "../../components/demo-controls";

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["pending", "escalated", "approved", "rejected"] as const;

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn",
  escalated: "info",
  approved: "ok",
  rejected: "danger",
};

const RISK_TONE: Record<string, BadgeTone> = {
  high: "danger",
  standard: "neutral",
  low: "ok",
};

export default async function KycQueue() {
  const cases = await prisma.kycCase.findMany({
    orderBy: { createdAt: "desc" },
  });
  const counts = new Map<string, number>();
  for (const c of cases) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);

  return (
    <AppShell title="KYC Review Queue" hubUrl="/">
      <PageHeader
        title="KYC Review Queue"
        description="Triage and decision customer identity-verification cases."
        actions={<DemoControls tool="kyc" />}
      />
      <StatGrid
        stats={[
          { label: "Total", value: cases.length, tone: "neutral" },
          ...STATUS_ORDER.map((s) => ({
            label: s,
            value: counts.get(s) ?? 0,
            tone: STATUS_TONE[s],
          })),
        ]}
      />
      <div className="stack">
        {cases.map((c) => (
          <Card key={c.id}>
            <div className="row-between">
              <Link href={`/kyc/cases/${c.id}`} className="card-title">
                #{c.id} — {c.customerName}
              </Link>
              <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
            </div>
            <Meta className="card-desc">
              <span>{c.customerId}</span>
              <span>·</span>
              <span>
                risk <Badge tone={RISK_TONE[c.riskTier] ?? "neutral"}>{c.riskTier}</Badge>
              </span>
              {c.decidedById ? (
                <>
                  <span>·</span>
                  <span>decided by {c.decidedById}</span>
                </>
              ) : null}
            </Meta>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
