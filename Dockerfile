FROM node:20-alpine AS base

# Installiere Abhängigkeiten nur wenn benötigt
FROM base AS deps
WORKDIR /app

# Installiere Abhängigkeiten basierend auf dem bevorzugten Paketmanager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js sammelt Telemetriedaten. Diese Zeile deaktiviert sie
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Setze die korrekten Berechtigungen für prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatisch nutze output traces um die Bildgröße zu reduzieren
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

