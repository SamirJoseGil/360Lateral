-- Base de datos para el sistema de gestión de lotes
-- Este script crea las tablas necesarias para el sistema, incluyendo usuarios, lotes, documentos, contactos y estadísticas.


-- 🧱 Requiere la extensión PostGIS si se usarán coordenadas geográficas
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 🧑 Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contraseña TEXT NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('ADMINISTRADOR', 'DUENO_LOTE', 'DESARROLLADOR')) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP
);

-- 🏗️ Tabla de lotes
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    propietario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_lote VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    -- Descomentar la siguiente línea si PostGIS está habilitado:
    -- coordenadas GEOMETRY(POINT, 4326),
    estado VARCHAR(20) CHECK (estado IN ('EN_REVISION', 'APROBADO', 'RECHAZADO')) NOT NULL DEFAULT 'EN_REVISION',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📄 Tabla de documentos por lote
CREATE TABLE documentos_lote (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) CHECK (tipo IN ('CTL', 'TOPOGRAFIA', 'PLANOS', 'ESTRUCTURA', 'ESTUDIO_SUELO')) NOT NULL,
    archivo TEXT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    editable_hasta TIMESTAMP NOT NULL,
    aprobado BOOLEAN DEFAULT FALSE
);

-- ⭐ Tabla de favoritos de lotes por desarrollador
CREATE TABLE favoritos (
    id SERIAL PRIMARY KEY,
    desarrollador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    lote_id INTEGER NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (desarrollador_id, lote_id)
);

-- 📬 Tabla de contactos entre desarrollador y dueño de lote
CREATE TABLE contactos (
    id SERIAL PRIMARY KEY,
    desarrollador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    lote_id INTEGER NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    fecha_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📊 Tabla de estadísticas de uso del sistema
CREATE TABLE estadisticas_acceso (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    accion VARCHAR(50) CHECK (accion IN (
        'LOGIN', 'VER_LOTE', 'CARGAR_DOCUMENTO', 'CONTACTO', 'FAVORITO'
    )) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
