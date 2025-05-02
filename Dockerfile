FROM huegelfest-base:latest AS builder

WORKDIR /app

# Kopiere nur die notwendigen Dateien für den Build
COPY --chown=node:node . .

# Baue die App
RUN npm run build

# Produktions-Image
FROM node:20-alpine

WORKDIR /app

# Kopiere nur die notwendigen Dateien
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

USER node

CMD ["node", ".next/standalone/server.js"]

