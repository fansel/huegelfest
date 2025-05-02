#!/bin/bash

# Baue das Base-Image
docker build -t huegelfest-base:latest -f Dockerfile.base .

# Baue das App-Image
docker build -t huegelfest-app:latest .

# Starte die Container
docker compose up -d 