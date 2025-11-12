FROM node:20-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production || true
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
