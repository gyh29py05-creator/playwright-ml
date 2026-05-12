FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

COPY . .

RUN npm init -y
RUN npm install express playwright@1.60.0

EXPOSE 3000

CMD ["node", "server.js"]
