Write-Host "🔄 Initializing database for Lateral 360°" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Ejecutar migraciones
Write-Host ""
Write-Host "📝 Running migrations..." -ForegroundColor Yellow
python manage.py migrate

# Crear superusuario
Write-Host ""
Write-Host "👤 Creating superuser..." -ForegroundColor Yellow
python scripts\create_superuser.py

# Cargar datos iniciales (opcional)
Write-Host ""
Write-Host "📦 Loading initial data (if exists)..." -ForegroundColor Yellow
if (Test-Path "scripts\initial_data.json") {
    python manage.py loaddata scripts\initial_data.json
} else {
    Write-Host "   No initial data file found, skipping..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Database initialization complete!" -ForegroundColor Green
