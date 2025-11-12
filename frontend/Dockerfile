FROM node:20-bullseye-slim
WORKDIR /app
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY painel-empresas/package*.json ./
RUN npm install --production
COPY painel-empresas . 
EXPOSE 3000
CMD ["npm", "start"]
