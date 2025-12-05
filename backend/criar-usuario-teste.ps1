$apiUrl = "http://localhost:3000"
$adminEmail = "jeansd@njbot.com"
$adminSenha = "Lock203001@191427MMaj@"

Write-Host "Fazendo login como admin..." -ForegroundColor Cyan

try {
  $loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/login" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
      email = $adminEmail
      senha = $adminSenha
    } | ConvertTo-Json)

  $token = $loginResponse.token
  Write-Host "Login bem-sucedido!" -ForegroundColor Green
  Write-Host ""

  Write-Host "Criando usuario teste..." -ForegroundColor Cyan
  
  $createResponse = Invoke-RestMethod -Uri "$apiUrl/api/users" `
    -Method Post `
    -Headers @{
      "Content-Type" = "application/json"
      "Authorization" = "Bearer $token"
    } `
    -Body (@{
      nome = "Usuario Teste"
      email = "teste@teste.com"
      senha = "teste123"
      role = "client"
    } | ConvertTo-Json)

  Write-Host "Usuario criado com sucesso!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Dados de acesso:" -ForegroundColor Yellow
  Write-Host "  Email: teste@teste.com"
  Write-Host "  Senha: teste123"
  Write-Host ""
  Write-Host "Agora faca login com essas credenciais" -ForegroundColor Green
}
catch {
  Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  Write-Host "Certifique-se de que:" -ForegroundColor Yellow
  Write-Host "  1. Backend esta rodando em http://localhost:3000"
  Write-Host "  2. MongoDB esta conectado"
}
