# ==============================================
# 🏗️ DOCKERFILE PARA REMIX - OPTIMIZADO
# ==============================================

# Stage 1: Build dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Development
FROM node:20-alpine AS development
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 remix && \
    chown -R remix:nodejs /app

USER remix

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start development server en puerto 3000 específicamente
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]