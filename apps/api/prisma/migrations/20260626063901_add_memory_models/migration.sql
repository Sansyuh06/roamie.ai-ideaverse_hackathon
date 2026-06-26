-- CreateTable
CREATE TABLE "MemoryAtom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL DEFAULT '[]',
    "tripId" TEXT,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "promotedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MemoryPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "consolidatedClaim" TEXT NOT NULL,
    "claimEmbedding" TEXT NOT NULL DEFAULT '[]',
    "supportingAtomIds" TEXT NOT NULL DEFAULT '[]',
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "lastValidatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MemoryAtom_userId_idx" ON "MemoryAtom"("userId");

-- CreateIndex
CREATE INDEX "MemoryAtom_agentName_idx" ON "MemoryAtom"("agentName");

-- CreateIndex
CREATE INDEX "MemoryPattern_userId_idx" ON "MemoryPattern"("userId");

-- CreateIndex
CREATE INDEX "MemoryPattern_agentName_idx" ON "MemoryPattern"("agentName");
