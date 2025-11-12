FROM node:20-bullseye-slim

# Install system dependencies for native addons
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    python3-dev \
    pkg-config \
    libffi-dev \
    ca-certificates && \ \
      git
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy entire repository
COPY . .

# Install root dependencies
RUN npm ci || true

# Install backend dependencies
RUN npm ci --prefix backend || true

# Install frontend dependencies
RUN npm ci --prefix frontend/painel-empresas || true

# Set port (can be overridden by Render PORT env var)
ENV PORT 3000
EXPOSE 3000

# Start backend server
CMD ["npm", "run", "backend"]
