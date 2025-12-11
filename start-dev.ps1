# Script para iniciar backend e frontend em terminais separados
# Facilita a visualização dos logs de cada serviço

Write-Host "🚀 Iniciando servidores em terminais separados..." -ForegroundColor Green
Write-Host ""

# Obter o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Iniciar backend em terminal separado
Write-Host "📦 Iniciando backend na porta 3001..." -ForegroundColor Cyan
$backendPath = Join-Path $scriptPath "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend - Logs do servidor' -ForegroundColor Yellow; Write-Host ''; npm run dev" -WindowStyle Normal

# Aguardar um pouco para o backend iniciar
Start-Sleep -Seconds 2

# Iniciar frontend em terminal separado
Write-Host "🎨 Iniciando frontend na porta 5173..." -ForegroundColor Cyan
$frontendPath = Join-Path $scriptPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 Frontend - Logs do Vite' -ForegroundColor Magenta; Write-Host ''; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servidores iniciados em terminais separados!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Informações:" -ForegroundColor Yellow
Write-Host "   • Backend: http://localhost:3001" -ForegroundColor White
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Os logs aparecerão nos terminais abertos acima" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar esta janela..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


