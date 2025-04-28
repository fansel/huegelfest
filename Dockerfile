FROM node:18-alpine

WORKDIR /app

# Installiere Abhängigkeiten
COPY package.json package-lock.json ./
RUN npm ci

# Kopiere den Rest des Codes
COPY . .

# Setze Umgebungsvariablen
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=true

# Überprüfe .env Datei
RUN if [ ! -f .env ]; then \
    echo "❌ .env Datei nicht gefunden" && exit 1; \
    else \
    echo "✅ .env Datei gefunden"; \
    fi

# Baue die Anwendung
RUN npm run build

# Exponiere den Port
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"]

