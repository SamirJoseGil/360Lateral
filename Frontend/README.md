# 360Lateral Frontend

Aplicación web para la plataforma de contratación lateral 360Lateral, construida con React, TypeScript y Vite.

## 🚀 Características

- **Autenticación de usuarios**: Sistema completo de login y registro
- **Dashboard interactivo**: Panel principal con métricas y navegación
- **Perfil de usuario**: Gestión de información personal
- **Diseño responsivo**: Optimizado para dispositivos móviles y desktop
- **Componentes reutilizables**: Arquitectura modular con componentes UI

## 🛠️ Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- ESLint

## 📁 Estructura del Proyecto

```
360Lateral-Frontend/
📦 app  
┣ 📂 components  
┃ ┣ 📂 atoms  
┃ ┣ 📂 dashboards  
┃ ┣ 📂 molecules  
┃ ┣ 📂 organisms  
┣ 📂 hooks  
┣ 📂 routes  
┣ 📂 services  
┣ 📂 types  
┣ 📂 utils  
┣ 📜 entry.client.tsx  
┣ 📜 entry.server.tsx  
┣ 📜 filesinfo.md  
┣ 📜 root.tsx  
┣ 📜 tailwind.css  
📂 info  
📂 node_modules  
📂 public  
📜 .dockerignore  
📜 .env.docker  
📜 .env.example  
📜 .eslintrc.cjs  
📜 Dockerfile  
📜 package-lock.json  
📜 package.json  
📜 postcss.config.js  
📜 README.md  
📜 remix.config.js  
📜 tailwind.config.ts  
📜 tsconfig.json  
📜 vite.config.ts

```

## ⚡ Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd 360Lateral-Frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Construir para producción**
   ```bash
   npm run build
   ```

## 🎯 Scripts Disponibles

- `npm run dev` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run lint` - Ejecuta ESLint para revisar el código
- `npm run preview` - Previsualiza la construcción de producción

## 🏗️ Arquitectura

### Componentes

- **auth/**: Componentes relacionados con autenticación
- **common/**: Componentes de layout y navegación
- **ui/**: Componentes de interfaz reutilizables

### Páginas

- **Home**: Página de inicio
- **Login/Register**: Páginas de autenticación
- **Dashboard**: Panel principal del usuario
- **Profile**: Gestión del perfil de usuario

## 📝 Notas de Desarrollo

- El proyecto utiliza TypeScript para mayor seguridad de tipos
- Tailwind CSS para estilos utilitarios
- Componentes funcionales con React Hooks
- Enrutamiento con React Router DOM

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.