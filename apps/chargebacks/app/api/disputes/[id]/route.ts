import { logAudit, prisma, withAuth } from "@internal-tools/framework";
import "../../../../lib/permissions";

const ACTIONS = new Set(["submit_evidence", "win", "lose"]);
const RESOLVED = new Set(["won", "lost"]);

export const GET = withAuth("chargebacks:read", async (_request, _user, context) => {
  const id = (await context.params)?.id;
  const dispute = await prisma.chargeback.findUnique({ where: { id: Number(id) } });
  if (!dispute) {
    return Response.json({ error: "dispute not found" }, { status: 404 });
  }
  return Response.json({ dispute });
});

export const PATCH = withAuth("chargebacks:write", async (request, user, context) => {
  const id = (await context.params)?.id;
  const dispute = await prisma.chargeback.findUnique({ where: { id: Number(id) } });
  if (!dispute) {
    return Response.json({ error: "dispute not found" }, { status: 404 });
  }
  const body = (await request.json()) as { action?: string; notes?: string };
  if (!body.action || !ACTIONS.has(body.action)) {
    return Response.json(
      { error: "action must be submit_evidence, win, or lose" },
      { status: 400 },
    );
  }
  if (RESOLVED.has(dispute.status)) {
    return Response.json(
      { error: `dispute ${dispute.id} is already resolved (${dispute.status})` },
      { status: 409 },
    );
  }
  if (body.action === "submit_evidence" && dispute.status !== "open") {
    return Response.json(
      { error: "evidence can only be submitted on an open dispute" },
      { status: 409 },
    );
  }
  const status =
    body.action === "submit_evidence"
      ? "evidence_submitted"
      : body.action === "win"
        ? "won"
        : "lost";
  const resolved = RESOLVED.has(status);
  const updated = await prisma.chargeback.update({
    where: { id: dispute.id },
    data: {
      status,
      resolvedById: resolved ? user.id : dispute.resolvedById,
      resolvedAt: resolved ? new Date() : dispute.resolvedAt,
      notes: body.notes ?? dispute.notes,
    },
  });
  await logAudit({
    actorId: user.id,
    action: `chargeback.${body.action}`,
    entity: "Chargeback",
    entityId: String(dispute.id),
    metadata: { from: dispute.status, to: status },
  });
  return Response.json({ dispute: updated });
});
