#!/bin/bash

# Finde alle TypeScript-Dateien in den API-Routen
find src/app/api -type f -name "*.ts" -exec sed -i '' 's|@/database/config/connector|@/database/config/apiConnector|g' {} +

# Aktualisiere die Server-Services
find src/server -type f -name "*.ts" -exec sed -i '' 's|@/database/config/connector|@/database/config/apiConnector|g' {} +

# Aktualisiere die Server-Actions
find src/server/actions -type f -name "*.ts" -exec sed -i '' 's|../../database/config/connector|../../database/config/apiConnector|g' {} + 