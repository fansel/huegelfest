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

# Füge das Admin-Passwort zur .env Datei hinzu, wenn es nicht existiert
RUN if [ ! -f .env ]; then \
    echo "NEXT_PUBLIC_ADMIN_PASSWORD=supergeilersommer" > .env; \
    fi

# Baue die Anwendung
RUN npm run build

# Exponiere den Port
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"]

