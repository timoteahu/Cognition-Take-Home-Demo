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

const STATUS_ORDER = ["open", "evidence_submitted", "won", "lost"] as const;
const ACTIVE_STATUSES = new Set(["open", "evidence_submitted"]);

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

export default async function Disputes() {
  const disputes = await prisma.chargeback.findMany({
    orderBy: { createdAt: "desc" },
  });
  const counts = new Map<string, number>();
  for (const d of disputes) counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
  const openExposure = disputes
    .filter((d) => ACTIVE_STATUSES.has(d.status))
    .reduce((sum, d) => sum + d.amountCents, 0);
  const now = new Date();

  return (
    <AppShell title="Chargeback Manager" hubUrl="/">
      <PageHeader
        title="Chargeback Manager"
        description="Track card disputes, evidence deadlines, and outcomes."
        actions={<DemoControls tool="chargebacks" />}
      />
      <StatGrid
        stats={[
          { label: "Total", value: disputes.length, tone: "neutral" },
          ...STATUS_ORDER.map((s) => ({
            label: s.replaceAll("_", " "),
            value: counts.get(s) ?? 0,
            tone: STATUS_TONE[s],
          })),
          {
            label: "At risk",
            value: money(openExposure > 0 ? openExposure : 0, "USD"),
            tone: openExposure > 0 ? "warn" : "neutral",
          },
        ]}
      />
      <div className="stack">
        {disputes.map((d) => {
          const overdue =
            d.deadline !== null &&
            d.deadline < now &&
            ACTIVE_STATUSES.has(d.status);
          return (
            <Card key={d.id}>
              <div className="row-between">
                <Link href={`/chargebacks/disputes/${d.id}`} className="card-title">
                  #{d.id} — {d.cardholderName}
                </Link>
                <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>
                  {d.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <Meta className="card-desc">
                <span>{d.transactionId}</span>
                <span>·</span>
                <span className="mono">{money(d.amountCents, d.currency)}</span>
                <span>·</span>
                <span>{d.reason.replaceAll("_", " ")}</span>
                {d.deadline ? (
                  <>
                    <span>·</span>
                    {overdue ? (
                      <Badge tone="danger">
                        overdue {d.deadline.toISOString().slice(0, 10)}
                      </Badge>
                    ) : (
                      <span>due {d.deadline.toISOString().slice(0, 10)}</span>
                    )}
                  </>
                ) : null}
              </Meta>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
