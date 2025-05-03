# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiere nur die notwendigen Dateien für den Build
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Installiere Dependencies und baue die App
RUN npm ci
RUN npm run build

# Produktions-Image
FROM node:20-alpine

WORKDIR /app

# Kopiere nur die notwendigen Dateien aus dem Builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Stelle sicher, dass die Verzeichnisstruktur existiert
RUN mkdir -p .next/static

# Setze den Benutzer auf node für bessere Sicherheit
USER node

# Die Umgebungsvariablen werden über docker-compose gesetzt
CMD ["node", "server.js"]

