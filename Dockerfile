FROM node:20-bullseye-slim

# Instala dependências de sistema necessárias para compilar addons nativos
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    python3-dev \
    pkg-config \
    libffi-dev \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia todo o repositório (método simples e robusto). Pode ser refinado para cache de camadas.
COPY . .

# Instala dependências do root, backend e frontend conforme necessário
RUN if [ -f package-lock.json ] || [ -f package.json ]; then npm ci || true; fi
RUN if [ -f backend/package.json ]; then npm ci --prefix backend || true; fi
RUN if [ -f frontend/painel-empresas/package.json ]; then npm ci --prefix frontend/painel-empresas || true; fi

# Porta padrão (pode ser sobrescrita pela variável PORT no Render)
ENV PORT 3000
EXPOSE 3000

# Comando padrão para rodar o backend (ajuste se necessário)
CMD ["npm", "run", "backend"]
