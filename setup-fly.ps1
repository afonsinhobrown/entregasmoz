# Setup inicial do Fly.io
# Execute APENAS UMA VEZ: .\setup-fly.ps1

Write-Host "⚙️ Setup inicial Fly.io - EntregasMoz" -ForegroundColor Cyan
Write-Host ""

# Verificar Fly CLI
if (!(Get-Command "fly" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI não instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalando Fly CLI..." -ForegroundColor Yellow
    powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
    
    Write-Host ""
    Write-Host "✅ Fly CLI instalado!" -ForegroundColor Green
    Write-Host "⚠️ REINICIE o terminal e execute este script novamente." -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Fly CLI encontrado" -ForegroundColor Green

# Login
Write-Host ""
Write-Host "🔐 Fazendo login no Fly.io..." -ForegroundColor Cyan
fly auth login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login falhou!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Login bem-sucedido" -ForegroundColor Green

# Launch (sem deploy)
Write-Host ""
Write-Host "🚀 Criando app no Fly.io..." -ForegroundColor Cyan
Write-Host "Sugestões:" -ForegroundColor Yellow
Write-Host "  - Nome da app: entregasmoz-[seu-nome]" -ForegroundColor White
Write-Host "  - Região: Frankfurt (fra)" -ForegroundColor White
Write-Host "  - PostgreSQL: NO (já tens Neon)" -ForegroundColor White
Write-Host "  - Redis: NO" -ForegroundColor White
Write-Host ""

fly launch --no-deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Criação da app falhou!" -ForegroundColor Red
    exit 1
}

# Secrets
Write-Host ""
Write-Host "🔑 Configurando secrets..." -ForegroundColor Cyan
Write-Host ""

$dbUrl = "postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
$directUrl = "postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"

Write-Host "Adicionando DATABASE_URL..." -ForegroundColor Yellow
fly secrets set DATABASE_URL="$dbUrl"

Write-Host "Adicionando DIRECT_URL..." -ForegroundColor Yellow
fly secrets set DIRECT_URL="$directUrl"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Setup completo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Rodar: .\deploy-fly.ps1" -ForegroundColor White
    Write-Host "  2. Aguardar deploy (~3-5 min)" -ForegroundColor White
    Write-Host "  3. Rodar: fly open" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Pronto para deploy!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Configuração de secrets falhou!" -ForegroundColor Red
    exit 1
}
