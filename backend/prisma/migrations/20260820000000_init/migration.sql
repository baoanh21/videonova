CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "VideoStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED');
CREATE TYPE "AssetKind" AS ENUM ('INPUT_IMAGE', 'OUTPUT_VIDEO', 'AVATAR');
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "displayName" TEXT,
  "phone" TEXT,
  "language" TEXT NOT NULL DEFAULT 'vi',
  "avatarPath" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "creditBalance" INTEGER NOT NULL DEFAULT 10,
  "notificationSettings" JSONB NOT NULL DEFAULT '{"video_completed":true,"video_failed":true,"low_credit":true,"product_updates":false}',
  "lowCreditThreshold" INTEGER NOT NULL DEFAULT 2,
  "passwordChangedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_isLocked_idx" ON "users"("role", "isLocked");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "tokenHash" TEXT NOT NULL,
  "userAgent" TEXT, "ipAddress" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

CREATE TABLE "password_reset_tokens" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

CREATE TABLE "videos" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "title" TEXT NOT NULL, "prompt" TEXT NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'local-ffmpeg', "style" TEXT NOT NULL DEFAULT 'cinematic',
  "provider" TEXT NOT NULL DEFAULT 'local-ffmpeg', "duration" INTEGER NOT NULL,
  "fps" INTEGER NOT NULL DEFAULT 30, "aspectRatio" TEXT NOT NULL,
  "enhanceQuality" BOOLEAN NOT NULL DEFAULT false, "creditCost" INTEGER NOT NULL DEFAULT 1,
  "status" "VideoStatus" NOT NULL DEFAULT 'QUEUED', "progress" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT, "completedAt" TIMESTAMP(3), "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "videos_userId_createdAt_idx" ON "videos"("userId", "createdAt");
CREATE INDEX "videos_status_createdAt_idx" ON "videos"("status", "createdAt");

CREATE TABLE "media_assets" (
  "id" UUID NOT NULL, "videoId" UUID NOT NULL, "kind" "AssetKind" NOT NULL,
  "storageKey" TEXT NOT NULL, "originalName" TEXT, "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL, "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");
CREATE INDEX "media_assets_videoId_kind_position_idx" ON "media_assets"("videoId", "kind", "position");

CREATE TABLE "video_jobs" (
  "id" UUID NOT NULL, "videoId" UUID NOT NULL, "queueJobId" TEXT,
  "status" "VideoStatus" NOT NULL DEFAULT 'QUEUED', "attempts" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT, "errorDetail" TEXT, "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "video_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "video_jobs_videoId_key" ON "video_jobs"("videoId");
CREATE UNIQUE INDEX "video_jobs_queueJobId_key" ON "video_jobs"("queueJobId");
CREATE INDEX "video_jobs_status_createdAt_idx" ON "video_jobs"("status", "createdAt");

CREATE TABLE "transactions" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "videoId" UUID,
  "type" "TransactionType" NOT NULL, "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "creditAmount" INTEGER NOT NULL, "balanceAfter" INTEGER NOT NULL,
  "amount" DECIMAL(14,2), "currency" TEXT NOT NULL DEFAULT 'VND', "description" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");
CREATE INDEX "transactions_type_status_createdAt_idx" ON "transactions"("type", "status", "createdAt");

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL, "actorId" UUID NOT NULL, "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, "metadata" JSONB,
  "ipAddress" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

CREATE TABLE "notifications" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "videoId" UUID, "transactionId" UUID,
  "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "videos" ADD CONSTRAINT "videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
