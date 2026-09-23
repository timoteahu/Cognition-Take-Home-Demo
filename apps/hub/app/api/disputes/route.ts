import { logAudit, prisma, withAuth } from "@internal-tools/framework";
import "../../../lib/permissions";

export const GET = withAuth("chargebacks:read", async (request) => {
  const status = new URL(request.url).searchParams.get("status");
  const disputes = await prisma.chargeback.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return Response.json({ disputes });
});

export const POST = withAuth("chargebacks:write", async (request, user) => {
  const body = (await request.json()) as {
    transactionId?: string;
    cardholderName?: string;
    amountCents?: number;
    currency?: string;
    reason?: string;
    deadline?: string;
    notes?: string;
  };
  if (!body.transactionId || !body.cardholderName || !body.reason) {
    return Response.json(
      { error: "transactionId, cardholderName, and reason are required" },
      { status: 400 },
    );
  }
  if (body.amountCents == null || !Number.isInteger(body.amountCents) || body.amountCents <= 0) {
    return Response.json(
      { error: "amountCents must be a positive integer" },
      { status: 400 },
    );
  }
  const deadline = body.deadline ? new Date(body.deadline) : undefined;
  if (deadline && Number.isNaN(deadline.getTime())) {
    return Response.json({ error: "deadline must be an ISO date" }, { status: 400 });
  }
  const existing = await prisma.chargeback.findUnique({
    where: { transactionId: body.transactionId },
  });
  if (existing) {
    return Response.json(
      { error: "a dispute already exists for this transaction", disputeId: existing.id },
      { status: 409 },
    );
  }
  const dispute = await prisma.chargeback.create({
    data: {
      transactionId: body.transactionId,
      cardholderName: body.cardholderName,
      amountCents: body.amountCents,
      currency: body.currency ?? "USD",
      reason: body.reason,
      deadline,
      notes: body.notes,
    },
  });
  await logAudit({
    actorId: user.id,
    action: "chargeback.create",
    entity: "Chargeback",
    entityId: String(dispute.id),
    metadata: { transactionId: dispute.transactionId, amountCents: dispute.amountCents },
  });
  return Response.json({ dispute }, { status: 201 });
});
