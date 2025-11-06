# 🔄 Script de Migración - SQLite a Supabase
# Ejecutar desde: dashboard-usittel/

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 MIGRACIÓN: SQLite → Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "src\lib\db.ts")) {
    Write-Host "❌ Error: Ejecutar desde dashboard-usittel/" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Verificando archivos..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

# 1. Backup del db.ts actual (SQLite)
if (Test-Path "src\lib\db.ts") {
    Write-Host "✅ Encontrado: db.ts (SQLite)" -ForegroundColor Green
    Write-Host "   Creando backup: db-sqlite-backup.ts" -ForegroundColor Gray
    Copy-Item "src\lib\db.ts" "src\lib\db-sqlite-backup.ts" -Force
    Write-Host "   ✓ Backup creado" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se encontró db.ts" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# 2. Verificar que existe db-supabase.ts
if (Test-Path "src\lib\db-supabase.ts") {
    Write-Host "✅ Encontrado: db-supabase.ts" -ForegroundColor Green
} else {
    Write-Host "❌ Error: No se encontró db-supabase.ts" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# 3. Reemplazar db.ts con db-supabase.ts
Write-Host ""
Write-Host "🔄 Activando Supabase..." -ForegroundColor Yellow
Copy-Item "src\lib\db-supabase.ts" "src\lib\db.ts" -Force
Write-Host "   ✓ db.ts ahora usa Supabase" -ForegroundColor Green

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ MIGRACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Archivos:" -ForegroundColor White
Write-Host "   • src/lib/db.ts              → Supabase (activo)" -ForegroundColor Green
Write-Host "   • src/lib/db-sqlite-backup.ts → SQLite (backup)" -ForegroundColor Gray
Write-Host "   • src/lib/db-supabase.ts      → Original (mantener)" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Próximos pasos:" -ForegroundColor White
Write-Host "   1. Verificar .env.local con credenciales de Supabase" -ForegroundColor Yellow
Write-Host "   2. npm run dev" -ForegroundColor Yellow
Write-Host "   3. Probar http://localhost:3000/api/status" -ForegroundColor Yellow
Write-Host ""
