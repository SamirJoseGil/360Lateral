# ==============================================
# 🏗️ DOCKERFILE PARA REMIX - DEVELOPMENT BUILD
# ==============================================
FROM node:20-alpine

# Instalar dependencias básicas
RUN apk add --no-cache libc6-compat

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer puerto 3000 (Remix default)
EXPOSE 3000

# Iniciar en modo desarrollo (evitando el build error en producción)
CMD ["npm", "run", "dev"]