# Script para iniciar os servidores
Write-Host "🚀 Iniciando servidores..." -ForegroundColor Green

# Iniciar backend
Write-Host "`n📦 Iniciando backend na porta 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# Aguardar um pouco
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "🎨 Iniciando frontend na porta 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "`n✅ Servidores iniciados!" -ForegroundColor Green
Write-Host "`n🌐 Acesse: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nPressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

