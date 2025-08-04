# ==============================================
# 🏗️ DOCKERFILE OPTIMIZADO PARA REMIX
# ==============================================

FROM node:18-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Configurar directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias usando npm install (más robusto que npm ci)
RUN npm install --silent

# Copiar código fuente
COPY . .

# Build usando npx directamente
RUN npx remix vite:build

# Stage 2: Nginx
FROM nginx:1.25-alpine

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos build
COPY --from=builder /app/build/client /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Comando
CMD ["nginx", "-g", "daemon off;"]
