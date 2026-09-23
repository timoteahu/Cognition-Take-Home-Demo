// Canned demo rows restored by POST /api/demo/reset and by db:seed.
// A function so time-relative fields stay fresh on each restore.
export function demoCases() {
  return [
    {
      customerId: "C-1001",
      customerName: "Alicia Gomez",
      riskTier: "high",
      status: "pending",
      notes: "PEP screening hit — verify source of funds.",
    },
    {
      customerId: "C-1002",
      customerName: "Brian Okafor",
      riskTier: "standard",
      status: "pending",
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
}

export const RANDOM_NAMES = [
  "Dana Reyes",
  "Omar Haddad",
  "Sofia Lindqvist",
  "Kenji Tanaka",
  "Fatima Al-Sayed",
  "Liam O'Connor",
  "Ingrid Bergstrom",
  "Diego Morales",
];

export const RISK_TIERS = ["low", "standard", "high"] as const;
