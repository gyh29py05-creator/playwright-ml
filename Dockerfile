FROM node:20-slim
RUN apt-get update && apt-get install -y \
    chromium \
    dbus \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
ENV CHROME_PATH=/usr/bin/chromium
ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:
WORKDIR /app
COPY . .
RUN npm init -y && npm install express playwright@1.60.0 dotenv
EXPOSE 3000
FROM mcr.microsoft.com/playwright:v1.60.0-noble
RUN apt-get update && apt-get install -y dbus dbus-x11 --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN npm init -y && npm install express playwright@1.60.0 dotenv
RUN npx playwright install chromium
EXPOSE 3000
CMD ["dbus-run-session", "node", "server.js"]
