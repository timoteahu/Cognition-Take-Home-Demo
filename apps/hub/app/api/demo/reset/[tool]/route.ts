import {
  logAudit,
  prisma,
  requirePermission,
  withAuth,
} from "@internal-tools/framework";
import "../../../../../lib/permissions";
import { demoCases, demoDisputes } from "../../../../../lib/demo-data";

const TOOLS = {
  kyc: {
    permission: "kyc:write",
    entity: "KycCase",
    reset: () => [
      prisma.auditEvent.deleteMany({ where: { entity: "KycCase" } }),
      prisma.kycCase.deleteMany(),
      prisma.kycCase.createMany({ data: demoCases() }),
    ],
    count: () => prisma.kycCase.count(),
  },
  chargebacks: {
    permission: "chargebacks:write",
    entity: "Chargeback",
    reset: () => [
      prisma.auditEvent.deleteMany({ where: { entity: "Chargeback" } }),
      prisma.chargeback.deleteMany(),
      prisma.chargeback.createMany({ data: demoDisputes() }),
    ],
    count: () => prisma.chargeback.count(),
  },
} as const;

type ToolKey = keyof typeof TOOLS;

// Demo helper: wipes a tool's records (and their audit trail) and restores
// the canned dataset so the queue can be replayed live.
export const POST = withAuth("tools:read", async (_request, user, context) => {
  const tool = (await context.params)?.tool as ToolKey | undefined;
  const config = tool ? TOOLS[tool] : undefined;
  if (!config) {
    return Response.json(
      { error: "tool must be kyc or chargebacks" },
      { status: 400 },
    );
  }
  requirePermission(user, config.permission);
  await prisma.$transaction(config.reset());
  const restored = await config.count();
  await logAudit({
    actorId: user.id,
    action: "demo.reset",
    entity: config.entity,
    metadata: { restored },
  });
  return Response.json({ reset: true, restored });
});
