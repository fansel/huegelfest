# Build Stage
FROM node:20-alpine AS builder

# Build Arguments
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG NEXT_PUBLIC_SITE_URL

# Setze Build Arguments als Environment Variables
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./

# Installiere Dependencies
RUN npm ci

# Kopiere den Rest des Codes
COPY src ./src
COPY public ./public

# Baue die Anwendung
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Kopiere nur die notwendigen Dateien
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Setze die Port
ENV PORT=3000
EXPOSE 3000

# Starte die Anwendung
CMD ["node", "server.js"]

