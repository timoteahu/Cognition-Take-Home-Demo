import { logAudit, prisma, withAuth } from "@internal-tools/framework";
import "../../../lib/permissions";

const RISK_TIERS = new Set(["low", "standard", "high"]);

export const GET = withAuth("kyc:read", async (request) => {
  const status = new URL(request.url).searchParams.get("status");
  const cases = await prisma.kycCase.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return Response.json({ cases });
});

export const POST = withAuth("kyc:write", async (request, user) => {
  const body = (await request.json()) as {
    customerId?: string;
    customerName?: string;
    riskTier?: string;
    notes?: string;
  };
  if (!body.customerId || !body.customerName) {
    return Response.json(
      { error: "customerId and customerName are required" },
      { status: 400 },
    );
  }
  if (body.riskTier && !RISK_TIERS.has(body.riskTier)) {
    return Response.json(
      { error: "riskTier must be low, standard, or high" },
      { status: 400 },
    );
  }
  const existing = await prisma.kycCase.findFirst({
    where: { customerId: body.customerId, status: { in: ["pending", "escalated"] } },
  });
  if (existing) {
    return Response.json(
      { error: "an open case already exists for this customer", caseId: existing.id },
      { status: 409 },
    );
  }
  const kycCase = await prisma.kycCase.create({
    data: {
      customerId: body.customerId,
      customerName: body.customerName,
      riskTier: body.riskTier ?? "standard",
      notes: body.notes,
    },
  });
  await logAudit({
    actorId: user.id,
    action: "kyc_case.create",
    entity: "KycCase",
    entityId: String(kycCase.id),
    metadata: { customerId: kycCase.customerId, riskTier: kycCase.riskTier },
  });
  return Response.json({ case: kycCase }, { status: 201 });
});
