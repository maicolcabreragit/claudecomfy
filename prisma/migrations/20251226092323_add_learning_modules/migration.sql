-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');

-- CreateTable
CREATE TABLE "LearningModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "status" "LearningStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningUnit" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningModule_topic_idx" ON "LearningModule"("topic");

-- CreateIndex
CREATE INDEX "LearningModule_status_idx" ON "LearningModule"("status");

-- CreateIndex
CREATE INDEX "LearningModule_createdAt_idx" ON "LearningModule"("createdAt");

-- CreateIndex
CREATE INDEX "LearningUnit_moduleId_idx" ON "LearningUnit"("moduleId");

-- AddForeignKey
ALTER TABLE "LearningUnit" ADD CONSTRAINT "LearningUnit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
