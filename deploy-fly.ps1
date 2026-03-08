# Script de Deploy Rápido para Fly.io
# Execute: .\deploy-fly.ps1

Write-Host "🚀 Deploy EntregasMoz para Fly.io" -ForegroundColor Cyan
Write-Host ""

# Verificar se Fly CLI está instalado
if (!(Get-Command "fly" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instalar com: powershell -Command `"iwr https://fly.io/install.ps1 -useb | iex`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Fly CLI encontrado" -ForegroundColor Green

# Verificar se já está logado
Write-Host ""
Write-Host "🔐 Verificando login..." -ForegroundColor Cyan
$loginCheck = fly auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não está logado no Fly.io" -ForegroundColor Red
    Write-Host "Execute: fly auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Autenticado como: $loginCheck" -ForegroundColor Green

# Build
Write-Host ""
Write-Host "🔨 Fazendo deploy..." -ForegroundColor Cyan
fly deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Comandos úteis:" -ForegroundColor Cyan
    Write-Host "  fly open          - Abrir app no browser" -ForegroundColor White
    Write-Host "  fly logs          - Ver logs em tempo real" -ForegroundColor White
    Write-Host "  fly status        - Ver status da app" -ForegroundColor White
    Write-Host "  fly dashboard     - Abrir dashboard" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deploy falhou! Ver logs acima." -ForegroundColor Red
    Write-Host "Troubleshooting: https://fly.io/docs/troubleshooting/" -ForegroundColor Yellow
    exit 1
}
