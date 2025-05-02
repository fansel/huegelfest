#!/bin/bash

# Baue das Base-Image ohne Cache
echo "Baue Base-Image..."
docker build --no-cache -t huegelfest-base:latest -f Dockerfile.base .

# Baue das App-Image ohne Cache
echo "Baue App-Image..."
docker build --no-cache -t huegelfest-app:latest .

# Starte die Container
echo "Starte Container..."
docker compose up -d 