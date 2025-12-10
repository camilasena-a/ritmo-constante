@echo off
chcp 65001 >nul
echo ========================================
echo    Iniciando Backend - Ritmo Constante
echo ========================================
echo.

REM Obter o diretório do script
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

REM Verificar se a pasta backend existe
if not exist "%BACKEND_DIR%" (
    echo ❌ Erro: Pasta 'backend' não encontrada!
    echo.
    echo Certifique-se de que este arquivo está na raiz do projeto.
    echo.
    pause
    exit /b 1
)

echo ✅ Pasta backend encontrada!
echo.
echo Abrindo terminal com o backend...
echo.

REM Navegar para a pasta backend e iniciar o servidor
cd /d "%BACKEND_DIR%"
start "Backend - Logs do Servidor" cmd /k "chcp 65001 >nul && echo 🔧 Backend - Logs do servidor && echo 📍 Porta: 3001 && echo 🌐 Health Check: http://localhost:3001/health && echo. && npm run dev"

echo.
echo ✅ Backend iniciado em nova janela!
echo.
echo 💡 Os logs aparecerão na janela que acabou de abrir.
echo.
echo 📋 Informações:
echo    • URL: http://localhost:3001
echo    • Health Check: http://localhost:3001/health
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul

