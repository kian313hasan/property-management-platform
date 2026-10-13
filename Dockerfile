# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
# TODO: switch to `npm ci` once package-lock.json is regenerated. It is currently out of sync with
# package.json (vitest, @playwright/test, react-hook-form, pg, ... are not locked), so `npm ci`
# would fail and installs are not reproducible. See docs/STATUS.md.
RUN npm install

FROM deps AS builder
COPY . .
# DATABASE_URL and AUTH_SECRET are validated when modules load, so they must exist during the
# build. They are provided as BuildKit secrets and are never written to an image layer.
RUN --mount=type=secret,id=database_url,env=DATABASE_URL \
    --mount=type=secret,id=auth_secret,env=AUTH_SECRET \
    npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "server.js"]
