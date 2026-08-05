# ── Stage 1: Build ─────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
RUN npm cache clean --force && npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2: Run ───────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/public/uploads && chown -R appuser:appgroup /app/public/uploads

USER appuser

EXPOSE 3000

CMD ["npm", "start"]