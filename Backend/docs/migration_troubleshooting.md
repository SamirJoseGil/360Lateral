# Solución de Problemas con Migraciones de Django

## Error: "no existe la relación «lotes_lote»"

Este error ocurre cuando Django intenta acceder a una tabla que no existe en la base de datos. Generalmente significa que las migraciones no se han aplicado correctamente.

## Solución Paso a Paso

### 1. Ejecutar script automático

La forma más sencilla es usar el script automático que creamos:

```
python apply_migrations.py
```

Este script generará y aplicará las migraciones automáticamente.

### 2. Solución manual

Si el script no funciona, sigue estos pasos manualmente:

#### a. Generar migraciones

```
python manage.py makemigrations
```

Si te pide especificar una app, puedes hacerlo:

```
python manage.py makemigrations lotes
```

#### b. Verificar migraciones pendientes

```
python manage.py showmigrations
```

Las migraciones no aplicadas aparecerán sin marcar [ ].

#### c. Aplicar migraciones

```
python manage.py migrate
```

Para aplicar migraciones específicas de una app:

```
python manage.py migrate lotes
```

### 3. Problemas avanzados

Si sigues teniendo problemas, podrías necesitar:

#### a. Fake migrations

Si las tablas ya existen pero Django piensa que no están migradas:

```
python manage.py migrate --fake-initial
```

#### b. Resetear migraciones (cuidado, solo en desarrollo)

En casos extremos, puedes borrar todas las migraciones y empezar de nuevo:

```
# 1. Borrar archivos de migración
rm apps/lotes/migrations/0*.py

# 2. Crear migración inicial
python manage.py makemigrations lotes

# 3. Aplicar con --fake si las tablas ya existen
python manage.py migrate lotes --fake
```

## Verificación

Después de aplicar las migraciones, verifica que la tabla exista:

1. Conéctate a la base de datos (PostgreSQL en este caso)
2. Lista las tablas: `\dt lotes_*`
3. Verifica que `lotes_lote` aparezca en la lista

## Prevención

Para evitar este problema en el futuro:

1. Siempre ejecuta migraciones después de cambiar modelos
2. Incluye el paso de migraciones en tu proceso de despliegue
3. Usa control de versiones para los archivos de migración