FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Erstelle .env Datei mit dem Admin-Passwort
RUN echo "NEXT_PUBLIC_ADMIN_PASSWORD=supergeilersommer" > .env

ENV NEXT_DISABLE_ESLINT=true
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

