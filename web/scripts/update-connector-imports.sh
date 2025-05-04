#!/bin/bash

echo "Suche nach verbleibenden connector-Imports..."

# Finde alle TypeScript-Dateien, die noch den alten connector importieren
find src -type f -name "*.ts" -exec grep -l "from.*connector" {} \; | while read -r file; do
  echo "Bearbeite $file"
  
  # Ersetze die Imports
  sed -i '' 's|from.*database/config/connector|from "@/database/config/apiConnector"|g' "$file"
  sed -i '' 's|from.*database/config/connector|from "../../database/config/apiConnector"|g' "$file"
  sed -i '' 's|from.*database/config/connector|from "../config/apiConnector"|g' "$file"
done

echo "Überprüfe auf verbleibende connector-Referenzen..."
grep -r "connector" --include="*.ts" src/

echo "Fertig!" 