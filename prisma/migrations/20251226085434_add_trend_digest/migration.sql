-- CreateTable
CREATE TABLE "TrendDigest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "trendIds" TEXT[],
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendDigest_createdAt_idx" ON "TrendDigest"("createdAt");
