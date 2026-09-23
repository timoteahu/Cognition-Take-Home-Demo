import { logAudit, prisma, withAuth } from "@internal-tools/framework";
import "../../../../lib/permissions";
import { demoDisputes } from "../../../../lib/demo-data";

// Demo helper: wipes this tool's records (and their audit trail) and restores
// the canned dataset so the queue can be replayed live.
export const POST = withAuth("chargebacks:write", async (_request, user) => {
  await prisma.$transaction([
    prisma.auditEvent.deleteMany({ where: { entity: "Chargeback" } }),
    prisma.chargeback.deleteMany(),
    prisma.chargeback.createMany({ data: demoDisputes() }),
  ]);
  const restored = await prisma.chargeback.count();
  await logAudit({
    actorId: user.id,
    action: "demo.reset",
    entity: "Chargeback",
    metadata: { restored },
  });
  return Response.json({ reset: true, restored });
});
