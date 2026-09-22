import { logAudit, prisma, withAuth } from "@internal-tools/framework";
import "../../../../lib/permissions";

const DECISIONS = new Set(["approve", "reject", "escalate"]);

export const GET = withAuth("kyc:read", async (_request, _user, context) => {
  const id = (await context.params)?.id;
  const kycCase = await prisma.kycCase.findUnique({ where: { id: Number(id) } });
  if (!kycCase) {
    return Response.json({ error: "case not found" }, { status: 404 });
  }
  return Response.json({ case: kycCase });
});

export const PATCH = withAuth("kyc:write", async (request, user, context) => {
  const id = (await context.params)?.id;
  const kycCase = await prisma.kycCase.findUnique({ where: { id: Number(id) } });
  if (!kycCase) {
    return Response.json({ error: "case not found" }, { status: 404 });
  }
  const body = (await request.json()) as { decision?: string; notes?: string };
  if (!body.decision || !DECISIONS.has(body.decision)) {
    return Response.json(
      { error: "decision must be approve, reject, or escalate" },
      { status: 400 },
    );
  }
  if (kycCase.status === "approved" || kycCase.status === "rejected") {
    return Response.json(
      { error: `case ${kycCase.id} is already ${kycCase.status}` },
      { status: 409 },
    );
  }
  const status =
    body.decision === "approve"
      ? "approved"
      : body.decision === "reject"
        ? "rejected"
        : "escalated";
  const updated = await prisma.kycCase.update({
    where: { id: kycCase.id },
    data: {
      status,
      decidedById: user.id,
      decidedAt: body.decision === "escalate" ? kycCase.decidedAt : new Date(),
      notes: body.notes ?? kycCase.notes,
    },
  });
  await logAudit({
    actorId: user.id,
    action: `kyc_case.${body.decision}`,
    entity: "KycCase",
    entityId: String(kycCase.id),
    metadata: { from: kycCase.status, to: status },
  });
  return Response.json({ case: updated });
});
