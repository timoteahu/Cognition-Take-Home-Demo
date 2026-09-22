-- CreateTable
CREATE TABLE "Chargeback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionId" TEXT NOT NULL,
    "cardholderName" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "deadline" DATETIME,
    "assigneeId" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Chargeback_transactionId_key" ON "Chargeback"("transactionId");

-- CreateIndex
CREATE INDEX "Chargeback_status_idx" ON "Chargeback"("status");
