import { PrismaClient } from "@prisma/client";
import { demoCases, demoDisputes } from "../../../apps/hub/lib/demo-data.ts";

const prisma = new PrismaClient();

const tools = [
  {
    name: "KYC Review Queue",
    description: "Triage and decision customer identity-verification cases.",
    url: "/kyc",
  },
  {
    name: "Chargeback Manager",
    description: "Track, evidence, and respond to disputed card transactions.",
    url: "/chargebacks",
  },
];

for (const tool of tools) {
  await prisma.tool.upsert({
    where: { name: tool.name },
    update: { url: tool.url },
    create: tool,
  });
}

const kycCases = demoCases();

for (const c of kycCases) {
  const existing = await prisma.kycCase.findFirst({
    where: { customerId: c.customerId },
  });
  if (!existing) {
    await prisma.kycCase.create({ data: c });
  }
}

const chargebacks = demoDisputes();

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
