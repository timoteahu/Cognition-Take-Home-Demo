// Canned demo rows restored by POST /api/demo/reset and by db:seed.
// A function so time-relative fields stay fresh on each restore.
export function demoDisputes() {
  return [
    {
      transactionId: "txn_9f42ab",
      cardholderName: "Elena Petrova",
      amountCents: 18450,
      reason: "fraudulent",
      status: "open",
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
}

export const RANDOM_NAMES = [
  "Jordan Blake",
  "Amara Osei",
  "Victor Nguyen",
  "Hannah Kim",
  "Raul Jimenez",
  "Mei Lin",
  "Tomasz Nowak",
  "Aisha Rahman",
];

export const REASONS = [
  "fraudulent",
  "product_not_received",
  "duplicate",
  "subscription_canceled",
  "credit_not_processed",
] as const;
