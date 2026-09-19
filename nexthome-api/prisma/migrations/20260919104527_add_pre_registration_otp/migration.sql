-- CreateTable
CREATE TABLE "pre_registration_otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_registration_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pre_registration_otps_phone_idx" ON "pre_registration_otps"("phone");
