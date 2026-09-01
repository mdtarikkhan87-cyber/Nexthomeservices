-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('landlord', 'tenant_buyer', 'service_provider', 'advertiser');

-- CreateEnum
CREATE TYPE "RoleState" AS ENUM ('role_added', 'pending_admin_document_review', 'role_verified');

-- CreateEnum
CREATE TYPE "SubscriptionState" AS ENUM ('inactive', 'pending_confirmation', 'active');

-- CreateEnum
CREATE TYPE "ContentItemState" AS ENUM ('pending_review', 'live', 'rejected');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('rent', 'sale');

-- CreateEnum
CREATE TYPE "RentDuration" AS ENUM ('short_term', 'long_term');

-- CreateEnum
CREATE TYPE "OccupancyType" AS ENUM ('entire', 'shared');

-- CreateEnum
CREATE TYPE "BathroomType" AS ENUM ('private_bath', 'shared_bath');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('available', 'occupied');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'duplex', 'bungalow', 'terrace', 'studio', 'detached');

-- CreateEnum
CREATE TYPE "FurnishingStatus" AS ENUM ('furnished', 'semi_furnished', 'unfurnished');

-- CreateEnum
CREATE TYPE "Amenity" AS ENUM ('borehole', 'power_backup', 'gated_security', 'parking', 'air_conditioning', 'fitted_kitchen', 'swimming_pool', 'balcony');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('stripe', 'paystack', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'in_review', 'resolved');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,
    "state" "RoleState" NOT NULL DEFAULT 'role_added',
    "subscriptionState" "SubscriptionState",
    "context" "ListingType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "state" TEXT NOT NULL,
    "lga" TEXT,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER,
    "rentDuration" "RentDuration",
    "propertyType" "PropertyType",
    "furnishing" "FurnishingStatus",
    "amenities" "Amenity"[],
    "photoUrl" TEXT NOT NULL,
    "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentItemState" NOT NULL DEFAULT 'pending_review',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "occupancyType" "OccupancyType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_details" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "bathroomType" "BathroomType" NOT NULL,
    "kitchenShared" BOOLEAN NOT NULL,
    "maxOccupantsPerRoom" INTEGER NOT NULL,
    "rentPerRoom" INTEGER NOT NULL,

    CONSTRAINT "shared_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_rooms" (
    "id" TEXT NOT NULL,
    "sharedDetailsId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'available',

    CONSTRAINT "shared_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_listings" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lgas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentItemState" NOT NULL DEFAULT 'pending_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "placement" TEXT,
    "status" "ContentItemState" NOT NULL DEFAULT 'pending_review',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "serviceListingId" TEXT,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rateeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "purpose" TEXT NOT NULL,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE INDEX "listings_state_type_status_idx" ON "listings"("state", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "shared_details_listingId_key" ON "shared_details"("listingId");

-- CreateIndex
CREATE INDEX "service_listings_state_status_idx" ON "service_listings"("state", "status");

-- CreateIndex
CREATE INDEX "conversations_participantAId_idx" ON "conversations"("participantAId");

-- CreateIndex
CREATE INDEX "conversations_participantBId_idx" ON "conversations"("participantBId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_details" ADD CONSTRAINT "shared_details_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_rooms" ADD CONSTRAINT "shared_rooms_sharedDetailsId_fkey" FOREIGN KEY ("sharedDetailsId") REFERENCES "shared_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_serviceListingId_fkey" FOREIGN KEY ("serviceListingId") REFERENCES "service_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rateeId_fkey" FOREIGN KEY ("rateeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_tickets" ADD CONSTRAINT "complaint_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
