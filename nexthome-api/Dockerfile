# Pulls the base image from AWS's public mirror of Docker's official images
# instead of Docker Hub. Railway's shared builders were being rate-limited by
# Docker Hub (429 Too Many Requests), which failed every build before it started.
FROM public.ecr.aws/docker/library/node:24-bookworm-slim

# Prisma's query engine needs OpenSSL, which the slim image doesn't ship.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first so this layer is cached until package files change.
# `postinstall` runs `prisma generate`, so the schema must be present.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
# Railway injects PORT; src/server.js reads it.
CMD ["node", "src/server.js"]
