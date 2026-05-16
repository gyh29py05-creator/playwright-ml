FROM mcr.microsoft.com/playwright:v1.60.0-noble
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
