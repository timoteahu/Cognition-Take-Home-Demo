import { logAudit, prisma, withAuth } from "@internal-tools/framework";
import "../../../../lib/permissions";
import { demoCases } from "../../../../lib/demo-data";

// Demo helper: wipes this tool's records (and their audit trail) and restores
// the canned dataset so the queue can be replayed live.
export const POST = withAuth("kyc:write", async (_request, user) => {
  await prisma.$transaction([
    prisma.auditEvent.deleteMany({ where: { entity: "KycCase" } }),
    prisma.kycCase.deleteMany(),
    prisma.kycCase.createMany({ data: demoCases() }),
  ]);
  const restored = await prisma.kycCase.count();
  await logAudit({
    actorId: user.id,
    action: "demo.reset",
    entity: "KycCase",
    metadata: { restored },
  });
  return Response.json({ reset: true, restored });
});
