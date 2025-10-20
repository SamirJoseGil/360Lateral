Write-Host "🔄 Gestionando migraciones de Lateral 360°" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Función para crear migraciones en orden
function Create-Migrations {
    Write-Host "📝 Creando migraciones en orden correcto..." -ForegroundColor Yellow
    Write-Host ""
    
    # 1. Users (debe ser primero)
    Write-Host "1️⃣ Creando migración para users..." -ForegroundColor Green
    python manage.py makemigrations users
    
    # 2. Common (skip si no tiene modelos)
    Write-Host "2️⃣ Verificando common..." -ForegroundColor Green
    $commonModels = python manage.py makemigrations common --dry-run 2>&1
    if ($commonModels -like "*No changes detected*") {
        Write-Host "   ℹ️  Common no tiene modelos, saltando..." -ForegroundColor Yellow
    } else {
        python manage.py makemigrations common
    }
    
    # 3. Authentication (skip si no tiene modelos)
    Write-Host "3️⃣ Verificando authentication..." -ForegroundColor Green
    $authModels = python manage.py makemigrations authentication --dry-run 2>&1
    if ($authModels -like "*No changes detected*") {
        Write-Host "   ℹ️  Authentication no tiene modelos propios, saltando..." -ForegroundColor Yellow
    } else {
        python manage.py makemigrations authentication
    }
    
    # 4. POT
    Write-Host "4️⃣ Creando migración para pot..." -ForegroundColor Green
    python manage.py makemigrations pot
    
    # 5. Lotes
    Write-Host "5️⃣ Creando migración para lotes..." -ForegroundColor Green
    python manage.py makemigrations lotes
    
    # 6. Documents
    Write-Host "6️⃣ Creando migración para documents..." -ForegroundColor Green
    python manage.py makemigrations documents
    
    # 7. Stats
    Write-Host "7️⃣ Creando migración para stats..." -ForegroundColor Green
    python manage.py makemigrations stats
    
    # 8. Cualquier otra pendiente
    Write-Host "8️⃣ Verificando migraciones pendientes..." -ForegroundColor Green
    python manage.py makemigrations
    
    Write-Host ""
    Write-Host "✅ Migraciones creadas correctamente" -ForegroundColor Green
}

# Función para aplicar migraciones
function Apply-Migrations {
    Write-Host ""
    Write-Host "🚀 Aplicando migraciones..." -ForegroundColor Yellow
    python manage.py migrate
    Write-Host "✅ Migraciones aplicadas correctamente" -ForegroundColor Green
}

# Ejecutar
Create-Migrations
Apply-Migrations

Write-Host ""
Write-Host "🎉 Proceso completado exitosamente" -ForegroundColor Cyan
