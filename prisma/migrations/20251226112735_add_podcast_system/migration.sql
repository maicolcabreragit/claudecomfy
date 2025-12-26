-- CreateEnum
CREATE TYPE "PodcastStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "script" TEXT NOT NULL,
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "audioSize" INTEGER,
    "voiceId" TEXT NOT NULL,
    "voiceSettings" JSONB,
    "status" "PodcastStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedPlatforms" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "trendIds" TEXT[],
    "digestId" TEXT,
    "creditsUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastConfig" (
    "id" TEXT NOT NULL,
    "podcastName" TEXT NOT NULL DEFAULT 'IA Sin Filtros',
    "podcastDescription" TEXT,
    "introScript" TEXT,
    "outroScript" TEXT,
    "defaultVoiceId" TEXT,
    "defaultVoiceSettings" JSONB,
    "characterPhrases" TEXT[],
    "targetDuration" INTEGER NOT NULL DEFAULT 300,
    "publishFrequency" TEXT,
    "spotifyShowId" TEXT,
    "ivooxShowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceMetadata" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "accent" TEXT,
    "gender" TEXT,
    "ageGroup" TEXT,
    "style" TEXT[],
    "podcastScore" INTEGER NOT NULL DEFAULT 5,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "sampleUrl" TEXT,
    "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PodcastEpisode_status_idx" ON "PodcastEpisode"("status");

-- CreateIndex
CREATE INDEX "PodcastEpisode_createdAt_idx" ON "PodcastEpisode"("createdAt");

-- CreateIndex
CREATE INDEX "VoiceMetadata_language_idx" ON "VoiceMetadata"("language");

-- CreateIndex
CREATE INDEX "VoiceMetadata_podcastScore_idx" ON "VoiceMetadata"("podcastScore");

-- CreateIndex
CREATE INDEX "VoiceMetadata_isRecommended_idx" ON "VoiceMetadata"("isRecommended");
