# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S moniqofi && adduser -S moniqofi -G moniqofi

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./

# Upload directory for CSV imports
RUN mkdir -p /app/uploads && chown moniqofi:moniqofi /app/uploads

USER moniqofi

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

CMD ["node", "src/app.js"]
