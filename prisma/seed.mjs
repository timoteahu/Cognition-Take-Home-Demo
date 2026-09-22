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

console.log(`Seeded ${tools.length} tools`);
await prisma.$disconnect();
