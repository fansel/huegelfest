#!/bin/bash

# Baue das Base-Image
echo "Baue Base-Image..."
docker build -t huegelfest-base:latest -f Dockerfile.base .

# Baue das App-Image mit --no-cache um sicherzustellen, dass alle Änderungen übernommen werden
echo "Baue App-Image..."
docker build --no-cache -t huegelfest-app:latest .

# Starte die Container
echo "Starte Container..."
docker compose up -d 