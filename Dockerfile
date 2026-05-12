FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

COPY . .

RUN npm init -y
RUN npm install express playwright

EXPOSE 3000

CMD ["node", "server.js"]
