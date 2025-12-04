FROM node:20-bullseye-slim

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Instalar dependências do backend
WORKDIR /app/backend
RUN npm ci

# Voltar para raiz
WORKDIR /app

EXPOSE 3000

# Iniciar backend
CMD ["npm", "start"]
