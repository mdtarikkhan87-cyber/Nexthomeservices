// Single shared Prisma Client instance for the whole app.
// Every route file requires this instead of creating its own PrismaClient
// (creating multiple instances can exhaust your database's connection pool).
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;