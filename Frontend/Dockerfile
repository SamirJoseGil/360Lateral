# ==============================================
# 🎨 DOCKERFILE PARA REMIX - MULTI-STAGE
# ==============================================

FROM node:20-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat curl

# Stage: Development
FROM base AS development

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Comando de desarrollo
CMD ["npm", "run", "dev"]

# Stage: Production Build
FROM base AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage: Production
FROM base AS production

WORKDIR /app

# Copiar package files y instalar solo dependencias de producción
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copiar build desde builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "start"]