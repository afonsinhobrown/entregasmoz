# ✅ Checklist Deploy Grátis - EntregasMoz

## 🎯 Pré-requisitos

- [x] Base de dados Neon configurada
- [x] `DATABASE_URL` e `DIRECT_URL` prontas
- [x] Projeto testado localmente (`npm run dev`)
- [x] Build funciona (`npm run build`)
- [ ] Escolher plataforma de deploy

---

## ⚡ Opção 1: Fly.io (Recomendado)

### Setup Inicial (só uma vez)

```bash
# 1. Instalar CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

Reinicia o terminal.

```bash
# 2. Login
fly auth login

# 3. Criar app
fly launch --no-deploy

# 4. Configurar secrets
fly secrets set DATABASE_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"

fly secrets set DIRECT_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
```

### Deploy

```bash
fly deploy
```

Aguarda 3-5 minutos.

```bash
fly open
```

### Checklist

- [ ] Fly CLI instalado
- [ ] Login feito
- [ ] App criada
- [ ] Secrets configurados
- [ ] Deploy bem-sucedido
- [ ] App acessível online
- [ ] Health check OK: `/api/health`
- [ ] Login funciona (nachingweya@gmail.com / 123456)

---

## 📱 Opção 2: Koyeb (Sem CLI)

1. [ ] Criar conta: [app.koyeb.com](https://app.koyeb.com)
2. [ ] New Service → GitHub
3. [ ] Conectar repo
4. [ ] Builder: Dockerfile
5. [ ] Port: 3000
6. [ ] Adicionar environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NODE_ENV=production`
7. [ ] Deploy
8. [ ] Testar app online

---

## 🌐 Opção 3: Adaptable.io

1. [ ] Criar conta: [adaptable.io](https://adaptable.io)
2. [ ] New App → GitHub
3. [ ] App Type: Node.js
4. [ ] Dockerfile: Yes
5. [ ] Environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
6. [ ] Deploy
7. [ ] Testar online

---

## ⚡ Deploy Automatizado (GitHub Actions)

### Fly.io CI/CD

1. Gerar token:
```bash
fly tokens create deploy
```

2. GitHub repo → Settings → Secrets → New:
   - Nome: `FLY_API_TOKEN`
   - Valor: [token do passo 1]

3. Criar `.github/workflows/fly.yml`:

```yaml
name: Deploy to Fly
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

4. Push para main → Deploy automático!

---

## 🆘 Troubleshooting Rápido

### Build falha
```bash
# Fly.io - aumentar timeout
fly deploy --build-timeout 600

# Koyeb - verificar logs no dashboard
```

### App não inicia
```bash
# Fly.io
fly logs

# Verificar health
curl https://[app].fly.dev/api/health
```

### Database não conecta
- [ ] `DATABASE_URL` tem `?sslmode=require`
- [ ] Neon permite todas as IPs (Settings → IP Allow)
- [ ] Credenciais corretas

### 502 Bad Gateway
```bash
# Fly.io - aumentar memória se necessário
fly scale memory 512
```

---

## 📊 Resultado Final

Após deploy bem-sucedido:

- ✅ App online 24/7
- ✅ HTTPS automático
- ✅ Base de dados Neon conectada
- ✅ Health check funcionando
- ✅ Login com usuários seed
- ✅ **Custo: R$ 0,00/mês**

**URLs Importantes:**
- App: `https://[teu-app].fly.dev`
- Health: `https://[teu-app].fly.dev/api/health`
- Admin: `nachingweya@gmail.com` / `123456`

---

## 🎓 Próximos Passos

- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar CI/CD com GitHub Actions
- [ ] Monitorar logs e métricas
- [ ] Fazer backup regular da base Neon
- [ ] Testar todas as funcionalidades online

---

**Tempo total:** 5-10 minutos! 🚀
