FROM mcr.microsoft.com/playwright:v1.60.0-noble
WORKDIR /app
COPY . .
RUN npm init -y && npm install express playwright@1.60.0 dotenv && npm install playwright-extra@4.3.6 puppeteer-extra-plugin-stealth
EXPOSE 3000
CMD ["node", "server.js"]
