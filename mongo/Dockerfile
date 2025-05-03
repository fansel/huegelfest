FROM mongo:latest

COPY init.js /docker-entrypoint-initdb.d/

# Setze Berechtigungen
RUN chmod +x /docker-entrypoint-initdb.d/init.js 