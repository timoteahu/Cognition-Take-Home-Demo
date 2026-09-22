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

console.log(`Seeded ${tools.length} tools, ${kycCases.length} kyc cases`);
await prisma.$disconnect();
