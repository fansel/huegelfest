FROM node:18-alpine

WORKDIR /app

# Installiere Abhängigkeiten
COPY package.json package-lock.json ./
RUN npm ci

# Kopiere die .env Datei aus dem übergeordneten Verzeichnis
COPY ../.env ./

# Kopiere den Rest des Codes
COPY . .

# Setze Umgebungsvariablen
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=true

# Lade Umgebungsvariablen aus der Datei
ARG VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG ADMIN_PASSWORD

ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
ENV NEXT_PUBLIC_ADMIN_PASSWORD=$ADMIN_PASSWORD

# Baue die Anwendung
RUN npm run build

# Exponiere den Port
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"]

