# Script para iniciar apenas o backend em um terminal separado
# Útil para depuração e visualização de logs

Write-Host "🔧 Iniciando apenas o backend..." -ForegroundColor Cyan
Write-Host ""

# Obter o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"

# Verificar se a pasta backend existe
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Erro: Pasta 'backend' não encontrada!" -ForegroundColor Red
    Write-Host "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Iniciar backend em terminal separado
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend - Logs do servidor' -ForegroundColor Yellow; Write-Host '📍 Porta: 3001' -ForegroundColor Gray; Write-Host '🌐 Health Check: http://localhost:3001/health' -ForegroundColor Gray; Write-Host ''; npm run dev" -WindowStyle Normal

Write-Host "✅ Backend iniciado em terminal separado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Informações:" -ForegroundColor Yellow
Write-Host "   • URL: http://localhost:3001" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Os logs aparecerão no terminal aberto acima" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar esta janela..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")









