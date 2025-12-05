@echo off
REM Script para criar usuário teste
REM Certifique-se que o backend está rodando em http://localhost:3000

echo 🔐 Fazendo login como admin...
curl -X POST http://localhost:3000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"jeansd@njbot.com\",\"senha\":\"Lock203001@191427MMaj@\"}" > temp_login.json

REM Extrair token (usando PowerShell)
for /f "tokens=*" %%i in ('powershell -Command "(Get-Content temp_login.json | ConvertFrom-Json).token"') do (
  set TOKEN=%%i
)

echo ✅ Login bem-sucedido
echo.
echo 👤 Criando usuário teste...
curl -X POST http://localhost:3000/api/users ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"nome\":\"Usuário Teste\",\"email\":\"teste@teste.com\",\"senha\":\"teste123\",\"role\":\"client\"}"

echo.
echo ✅ Usuário criado!
echo.
echo 📋 Dados de acesso:
echo   Email: teste@teste.com
echo   Senha: teste123
echo.
del temp_login.json

pause
