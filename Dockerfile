FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY web/package.json web/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build


# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Copy only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Kopiere nur die benötigten node_modules ins Standalone-Verzeichnis
COPY --from=builder /app/node_modules/ws .next/standalone/node_modules/ws
COPY --from=builder /app/node_modules/next .next/standalone/node_modules/next
COPY --from=builder /app/node_modules/react .next/standalone/node_modules/react
COPY --from=builder /app/node_modules/react-dom .next/standalone/node_modules/react-dom
# ggf. weitere benötigte Pakete

# Kopiere deine eigenen Module, falls sie nicht schon im Standalone-Build sind
COPY --from=builder /app/src .next/standalone/src



# Set permissions
RUN chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]