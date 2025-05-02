FROM huegelfest-base:latest

# Kopiere nur die notwendigen Dateien
COPY . .

# Setze Berechtigungen
RUN chown -R node:node /app

# Wechsle zu non-root User
USER node

# Starte die App
CMD ["npm", "start"]

