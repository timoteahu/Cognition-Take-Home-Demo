import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tools = [
  {
    name: "KYC Review Queue",
    description: "Triage and decision customer identity-verification cases.",
  },
  {
    name: "Chargeback Manager",
    description: "Track, evidence, and respond to disputed card transactions.",
  },
];

for (const tool of tools) {
  await prisma.tool.upsert({
    where: { name: tool.name },
    update: {},
    create: tool,
  });
}

const kycCases = [
  {
    customerId: "C-1001",
    customerName: "Alicia Gomez",
    riskTier: "high",
    notes: "PEP screening hit — verify source of funds.",
  },
  {
    customerId: "C-1002",
    customerName: "Brian Okafor",
    riskTier: "standard",
  },
  {
    customerId: "C-1003",
    customerName: "Chen Wei",
    riskTier: "low",
    status: "approved",
    decidedById: "u-admin",
    decidedAt: new Date(),
  },
];

for (const c of kycCases) {
  const existing = await prisma.kycCase.findFirst({
    where: { customerId: c.customerId },
  });
  if (!existing) {
    await prisma.kycCase.create({ data: c });
  }
}

const chargebacks = [
  {
    transactionId: "txn_9f42ab",
    cardholderName: "Elena Petrova",
    amountCents: 18450,
    reason: "fraudulent",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: "Cardholder claims card-not-present fraud.",
  },
  {
    transactionId: "txn_7c11de",
    cardholderName: "Marcus Hale",
    amountCents: 6200,
    reason: "product_not_received",
    status: "evidence_submitted",
  },
  {
    transactionId: "txn_3b88fa",
    cardholderName: "Priya Nair",
    amountCents: 9900,
    reason: "duplicate",
    status: "won",
    resolvedById: "u-builder",
    resolvedAt: new Date(),
  },
];

for (const cb of chargebacks) {
  await prisma.chargeback.upsert({
    where: { transactionId: cb.transactionId },
    update: {},
    create: cb,
  });
}

console.log(
  `Seeded ${tools.length} tools, ${kycCases.length} kyc cases, ${chargebacks.length} chargebacks`,
);
await prisma.$disconnect();
