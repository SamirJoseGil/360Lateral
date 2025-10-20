Write-Host "📁 Creando directorios de migraciones..." -ForegroundColor Cyan

$apps = @('users', 'authentication', 'lotes', 'documents', 'stats', 'pot', 'common')

foreach ($app in $apps) {
    $migrationDir = "apps\$app\migrations"
    
    if (-not (Test-Path $migrationDir)) {
        New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
        Write-Host "✅ Creado: $migrationDir" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Ya existe: $migrationDir" -ForegroundColor Yellow
    }
    
    $initFile = "$migrationDir\__init__.py"
    if (-not (Test-Path $initFile)) {
        New-Item -ItemType File -Path $initFile -Force | Out-Null
        Write-Host "✅ Creado: $initFile" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Directorios creados exitosamente" -ForegroundColor Cyan
