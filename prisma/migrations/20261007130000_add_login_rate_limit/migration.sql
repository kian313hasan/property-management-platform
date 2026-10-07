CREATE TABLE "LoginRateLimit" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "blockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoginRateLimit_key_key" ON "LoginRateLimit"("key");
CREATE INDEX "LoginRateLimit_blockedUntil_idx" ON "LoginRateLimit"("blockedUntil");
CREATE INDEX "LoginRateLimit_updatedAt_idx" ON "LoginRateLimit"("updatedAt");
