// Demo data for LOCAL development: `node scripts/seed-dev.js`
//
// It creates a set of demo accounts (one per role, plus a landlord who is not
// verified yet and an account that holds several roles), a handful of live
// property listings, service listings and an ad. Every demo account uses the
// password "password123". Safe to run more than once: rows have fixed ids and
// are upserted, so a second run resets them rather than duplicating them.
//
// SAFETY: this script refuses to run unless DATABASE_URL points at this
// machine, so it can never write demo accounts into a real database.

require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

function assertLocalDatabase() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set.");
  let host;
  try {
    host = new URL(raw).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"];
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production. Seed data is for local development only.");
  }
  if (!local.includes(host)) {
    throw new Error(
      `Refusing to seed: DATABASE_URL points at "${host}", not at this machine. ` +
        "Seed data is for a local development database only.",
    );
  }
  return host;
}

const prisma = new PrismaClient();
const PASSWORD = "password123";

const PHOTOS = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=70",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=70",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=70",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=70",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=70",
];

// email, name, isAdmin, roles: [{ role, state, subscriptionState?, context? }]
const USERS = [
  { email: "admin@demo.test", name: "Demo Admin", isAdmin: true, roles: [] },
  { email: "tenant@demo.test", name: "Tunde Tenant", roles: [{ role: "tenant_buyer", state: "role_verified", context: "rent" }] },
  { email: "landlord@demo.test", name: "Ada Landlord", roles: [{ role: "landlord", state: "role_verified", subscriptionState: "active" }] },
  // A landlord who registered but has not been through document review yet.
  { email: "landlord.new@demo.test", name: "Nkem Newlandlord", roles: [{ role: "landlord", state: "role_added", subscriptionState: "inactive" }] },
  { email: "provider@demo.test", name: "Sade Provider", roles: [{ role: "service_provider", state: "role_verified" }] },
  { email: "advertiser@demo.test", name: "Ife Advertiser", roles: [{ role: "advertiser", state: "role_verified" }] },
  {
    email: "multi@demo.test",
    name: "Musa Multirole",
    roles: [
      { role: "landlord", state: "role_verified", subscriptionState: "active" },
      { role: "tenant_buyer", state: "role_verified", context: "rent" },
      { role: "service_provider", state: "pending_admin_document_review" },
      { role: "advertiser", state: "role_verified" },
    ],
  },
];

// Owned by landlord@demo.test. `n` makes the fixed id.
const LISTINGS = [
  { n: 1, type: "rent", status: "live", title: "Cosy studio near Yaba tech hub", state: "Lagos", lga: "Lagos Mainland", price: 1200000, bedrooms: 1, bathrooms: 1, propertyType: "studio", rentDuration: "long_term", amenities: ["power_backup", "borehole"], furnishing: "furnished" },
  { n: 2, type: "rent", status: "live", title: "Modern 2-bed flat, Wuse 2", state: "Abuja (FCT)", lga: "Municipal Area Council", price: 3200000, bedrooms: 2, bathrooms: 2, propertyType: "apartment", rentDuration: "long_term", amenities: ["parking", "gated_security", "air_conditioning"] },
  { n: 3, type: "rent", status: "live", title: "Spacious 3-bed apartment, Eti-Osa", state: "Lagos", lga: "Eti-Osa", price: 4500000, bedrooms: 3, bathrooms: 2, propertyType: "apartment", rentDuration: "short_term", amenities: ["swimming_pool", "parking", "balcony", "fitted_kitchen"], furnishing: "semi_furnished", viewCount: 128 },
  { n: 4, type: "sale", status: "live", title: "3-bed terrace, Ajah", state: "Lagos", lga: "Eti-Osa", price: 85000000, bedrooms: 3, bathrooms: 2, propertyType: "terrace", amenities: ["gated_security", "parking"] },
  { n: 5, type: "sale", status: "live", title: "4-bed detached duplex, Lekki", state: "Lagos", lga: "Eti-Osa", price: 240000000, bedrooms: 4, bathrooms: 5, propertyType: "detached", amenities: ["swimming_pool", "power_backup", "borehole", "gated_security"] },
  { n: 6, type: "rent", status: "pending_review", title: "2-bed bungalow awaiting review", state: "Oyo", lga: "Ibadan North", price: 900000, bedrooms: 2, bathrooms: 1, propertyType: "bungalow", rentDuration: "long_term", amenities: [] },
  { n: 7, type: "rent", status: "rejected", title: "Rejected listing example", state: "Rivers", lga: "Port Harcourt", price: 700000, bedrooms: 1, bathrooms: 1, propertyType: "apartment", rentDuration: "long_term", amenities: [] },
];

const SERVICES = [
  { n: 1, category: "Plumbing", status: "live", state: "Lagos", lgas: [], description: "Licensed plumber covering Lagos Island and Mainland. Fast call-outs, fair prices." },
  { n: 2, category: "Electrician", status: "live", state: "Abuja (FCT)", lgas: ["Municipal Area Council", "Bwari"], description: "Wiring, inverter installation and fault finding across central Abuja." },
  { n: 3, category: "Painter", status: "pending_review", state: "Oyo", lgas: [], description: "Interior and exterior painting. Awaiting review." },
];

async function main() {
  const host = assertLocalDatabase();
  console.log(`Seeding the local database at ${host} ...`);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const now = new Date();
  const ids = {};

  for (const [i, u] of USERS.entries()) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, passwordHash, isAdmin: !!u.isAdmin },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        isAdmin: !!u.isAdmin,
        phone: `+23480100000${String(i + 1).padStart(2, "0")}`,
        motherMaidenName: "Demo",
        emailVerifiedAt: now,
        phoneVerifiedAt: now,
      },
    });
    ids[u.email] = user.id;
    for (const r of u.roles) {
      const data = {
        state: r.state,
        subscriptionState: r.subscriptionState ?? null,
        context: r.context ?? null,
        documentUrl: r.state === "role_added" ? null : "documents/demo/seed-document.pdf",
        documentSubmittedAt: r.state === "role_added" ? null : now,
      };
      await prisma.userRole.upsert({
        where: { userId_role: { userId: user.id, role: r.role } },
        update: data,
        create: { userId: user.id, role: r.role, ...data },
      });
    }
  }

  for (const l of LISTINGS) {
    const { n, ...rest } = l;
    const data = {
      ...rest,
      description: `${l.title}. A demo listing for local development; the details are made up.`,
      photoUrl: PHOTOS[(n - 1) % PHOTOS.length],
      galleryUrls: [],
      verified: l.status === "live",
      landlordId: ids["landlord@demo.test"],
      viewCount: l.viewCount ?? 0,
    };
    await prisma.listing.upsert({ where: { id: `seed-listing-${n}` }, update: data, create: { id: `seed-listing-${n}`, ...data } });
  }

  for (const s of SERVICES) {
    const { n, ...rest } = s;
    const data = { ...rest, providerId: ids["provider@demo.test"], verified: s.status === "live", photoUrl: null };
    await prisma.serviceListing.upsert({ where: { id: `seed-service-${n}` }, update: data, create: { id: `seed-service-${n}`, ...data } });
  }

  const ad = {
    advertiserId: ids["advertiser@demo.test"],
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=70",
    headline: "Demo advert: your business here",
    linkUrl: "https://example.com",
    placement: "homepage-banner",
    status: "live",
  };
  await prisma.advertisement.upsert({ where: { id: "seed-ad-1" }, update: ad, create: { id: "seed-ad-1", ...ad } });

  const [users, listings, services] = await Promise.all([prisma.user.count(), prisma.listing.count(), prisma.serviceListing.count()]);
  console.log(`Done. ${users} users, ${listings} listings, ${services} service listings. Password for every demo account: ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
