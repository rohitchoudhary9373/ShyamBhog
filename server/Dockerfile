# --- Build Stage ---
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install both production and development dependencies (needed for compiling/linting if needed)
RUN npm ci

COPY . .

# --- Production Stage ---
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5001

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create volume/directory for persistent logs
RUN mkdir -p logs uploads

EXPOSE 5001

CMD ["node", "server.js"]
