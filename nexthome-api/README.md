# nexthome-api

Express 5 + Prisma (PostgreSQL) backend for NextHome: auth, listings, services, ads,
messaging (Socket.IO), trust-layer verification, ratings, complaints and admin tooling.
Plain CommonJS JavaScript — no NestJS, no build step.

## Run it

```bash
cp .env.example .env        # fill in the values — see the legend inside
npm install                 # also runs `prisma generate`
npx prisma migrate deploy   # apply migrations to DATABASE_URL
npm run dev                 # nodemon, http://localhost:4000
npm start                   # production: node src/server.js
```

The server validates its environment at boot (`src/lib/env.js`) and exits with a clear
message if anything required is missing. `.env.example` lists every variable.
`GET /health` returns `{ "status": "ok" }`.

> Note: the Prisma client auto-loads `.env` from this directory, so values there are used
> even when you run scripts from elsewhere. Pre-set a variable (even to empty) in your
> shell to override it.

## Layout

```
src/
  server.js        boot: assertEnv(), HTTP server, Socket.IO
  app.js           middleware (helmet, CORS, cookies, rate limits) and route mounting
  routes/          one file per resource (auth, listings, services, ads, admin, ...)
  middleware/      authenticate / requireRole / requireAdmin
  lib/
    env.js           boot-time env validation
    refresh-tokens.js  refresh-token issue / rotate / revoke + cookie helpers
    rate-limit.js    express-rate-limit presets
    s3.js, email.js, sms.js, socket.js, cors-origins.js
prisma/            schema.prisma and migrations
```

## Auth model

- **Access token**: short-lived JWT (15m), returned in the JSON body, sent as
  `Authorization: Bearer`.
- **Refresh token**: opaque random string in an httpOnly `nh_refresh` cookie (path `/auth`),
  stored hashed in `refresh_tokens`. `POST /auth/refresh` rotates it on every use; presenting
  an already-rotated token revokes the whole session family. `POST /auth/logout` revokes the
  session server-side. A password reset revokes all of a user's sessions.
- Cross-site cookies: production defaults to `SameSite=None; Secure`. Safari blocks these as
  third-party, so serve the API from a subdomain of the frontend's domain and set
  `REFRESH_COOKIE_SAMESITE=lax`.

## Rate limits (per IP)

Global 600 / 15 min · login 10 failures / 15 min · OTP / verification-email sends 5 / hour ·
OTP code checks 20 / 15 min · register, forgot-password 20 / hour. Behind Railway's proxy
(`trust proxy` = 1) so the limits key on the real client IP.

## Uploads

Presigned S3 PUT URLs (`POST /uploads/presign`). S3 is mandatory in production. Outside
production, if no AWS variables are set, uploads fall back to local disk under `uploads/`
(`/dev-fake-upload`, `/dev-fake-file`) — never registered in production.

## Checks

```bash
npx oxlint src          # lint
npx prisma validate     # schema
```
