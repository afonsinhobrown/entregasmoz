# ✈️ Deploy Grátis no Fly.io (5 minutos)

## ✅ Por que Fly.io?
- ✅ **100% Grátis** - 3 apps permanentes
- ✅ **Sempre Online** - Não hiberna
- ✅ **256MB RAM** por app (suficiente para Next.js)
- ✅ **Global CDN** - Rápido em qualquer lugar
- ✅ **PostgreSQL Grátis** (já tens Neon)

---

## 🚀 Passo a Passo

### 1. Instalar Fly CLI

**Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

Reinicia o terminal após instalação.

---

### 2. Login

```bash
fly auth login
```

Abre o browser automaticamente para autenticar.

---

### 3. Criar App (primeira vez)

```bash
fly launch --no-deploy
```

**Respostas sugeridas:**
```
? Choose an app name: entregasmoz-[teu-nome]
? Choose a region: Frankfurt, Germany (fra)
? Would you like to set up a PostgreSQL database? No
? Would you like to set up an Upstash Redis database? No
```

---

### 4. Configurar Variáveis de Ambiente

```bash
fly secrets set DATABASE_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"

fly secrets set DIRECT_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
```

---

### 5. Deploy!

```bash
fly deploy
```

**Aguarda ~3-5 minutos.** O Fly.io vai:
1. Build o Dockerfile
2. Upload da imagem
3. Deploy do container
4. Health check

---

### 6. Abrir App

```bash
fly open
```

Ou acessa: `https://[teu-app].fly.dev`

---

## 🔄 Próximos Deploys

Depois da primeira vez, é só:

```bash
git add .
git commit -m "update"
git push

# E depois:
fly deploy
```

---

## 📊 Monitoramento

**Ver logs em tempo real:**
```bash
fly logs
```

**Status da app:**
```bash
fly status
```

**Dashboard:**
```bash
fly dashboard
```

**Health check:**
```
https://[teu-app].fly.dev/api/health
```

---

## 🆘 Troubleshooting

### Build muito lento
```bash
fly deploy --build-timeout 600
```

### App não inicia
```bash
# Ver logs
fly logs

# Ver status
fly status

# Reiniciar
fly apps restart [app-name]
```

### Erro de conexão DB
Verifica se:
- `DATABASE_URL` tem `?sslmode=require`
- Neon permite conexões de qualquer IP
- Credenciais estão correctas

```bash
# Testar secrets
fly secrets list
```

### Erro 502 Bad Gateway
```bash
# Aumentar memória (se precisar)
fly scale memory 512
```

### Cold starts lentos
Fly.io free tier pode ter cold starts. Para evitar:
- Health checks mantêm app activa
- Ou usa outro serviço como Koyeb (sempre online)

---

## 🎯 Comandos Úteis

```bash
# Ver apps
fly apps list

# Escalar (se precisar)
fly scale count 1
fly scale memory 512

# Destruir app
fly apps destroy [app-name]

# Ver secrets
fly secrets list

# Remover secret
fly secrets unset SECRET_NAME

# SSH na máquina
fly ssh console

# Ver métricas
fly metrics
```

---

## 💡 Dicas Avançadas

### Deploy automático do GitHub

1. Gerar token Fly.io:
```bash
fly tokens create deploy
```

2. Adicionar no GitHub:
- Settings → Secrets → New secret
- Nome: `FLY_API_TOKEN`
- Valor: [token gerado]

3. Criar `.github/workflows/fly.yml`:
```yaml
name: Deploy to Fly.io
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

Agora cada push faz deploy automático!

---

## 📈 Limites Free Tier

- **Apps:** 3 (máximo)
- **RAM:** 256MB por app
- **Storage:** 3GB total
- **Bandwidth:** 160GB/mês
- **Build time:** Ilimitado

**Mais que suficiente para começar!**

---

## ✅ Checklist Final

- [ ] Fly CLI instalado
- [ ] `fly auth login` feito
- [ ] `fly launch` configurado
- [ ] Secrets adicionados (`DATABASE_URL`, `DIRECT_URL`)
- [ ] `fly deploy` funcionou
- [ ] App acessível: `https://[app].fly.dev`
- [ ] Health check OK: `/api/health`
- [ ] Login funciona com credenciais seed

---

**Total: ~5 minutos do zero ao deploy! 🚀**

**Custos: R$ 0,00 permanente! 💰**
