-- AlterTable: existing rows default to published, so nothing existing changes visibility.
ALTER TABLE "listings" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;
