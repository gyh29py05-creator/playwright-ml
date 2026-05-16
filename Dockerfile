FROM mcr.microsoft.com/playwright:v1.60.0-noble
RUN apt-get update && apt-get install -y dbus dbus-x11 --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN npm init -y && npm install express playwright@1.60.0 dotenv
RUN mkdir -p /app/tiktok-profile
EXPOSE 3000
CMD ["dbus-run-session", "node", "server.js"]
