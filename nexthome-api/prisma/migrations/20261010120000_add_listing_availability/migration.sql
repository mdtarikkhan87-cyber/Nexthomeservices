-- CreateEnum
CREATE TYPE "ListingAvailability" AS ENUM ('available', 'rented', 'sold');

-- AlterTable: existing rows default to 'available', so nothing existing changes.
ALTER TABLE "listings" ADD COLUMN "availability" "ListingAvailability" NOT NULL DEFAULT 'available';
