# 🆓 Deploy Gratuito - EntregasMoz

## Opções 100% Gratuitas (sem Render/Vercel/Railway)

---

## 1️⃣ Fly.io (Recomendado) ⭐

> **⚡ Tutorial detalhado:** [FLY.md](FLY.md) para passo-a-passo completo

**Plano Grátis:**
- 3 apps gratuitas (256MB RAM cada)
- 3GB storage persistente
- 160GB bandwidth/mês
- **PERMANENTE** (não expira)

**Deploy:**
```bash
# Instalar CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Deploy (primeira vez)
fly launch --no-deploy

# Adicionar secrets
fly secrets set DATABASE_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
fly secrets set DIRECT_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"

# Deploy
fly deploy

# Abrir app
fly open
```

**Tempo:** ~5 minutos

---

## 2️⃣ Koyeb

**Plano Grátis:**
- 1 app gratuita
- 512MB RAM
- Sempre online
- **PERMANENTE**

**Deploy:**
1. Criar conta: [koyeb.com](https://app.koyeb.com)
2. Create Service → GitHub
3. Conectar repo `entregasmoz`
4. Build:
   - **Builder:** Dockerfile
   - **Port:** 3000
5. Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NODE_ENV=production
   ```
6. Deploy!

**Tempo:** ~3 minutos

---

## 3️⃣ Adaptable.io

**Plano Grátis:**
- Apps ilimitadas
- 512MB RAM
- Sempre online
- **PERMANENTE**

**Deploy:**
1. [adaptable.io](https://adaptable.io) → Sign up
2. New App → Connect GitHub
3. Selecionar repo
4. App Type: **Node.js**
5. Dockerfile: **Sim**
6. Environment:
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   ```
7. Deploy!

**Tempo:** ~4 minutos

---

## 4️⃣ Zeabur

**Plano Grátis:**
- $5 crédito/mês (grátis permanente)
- 3 projetos
- Auto-scaling

**Deploy:**
1. [zeabur.com](https://zeabur.com) → GitHub login
2. New Project → Import from GitHub
3. Selecionar repo
4. Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   ```
5. Deploy automático!

**Tempo:** ~3 minutos

---

## 5️⃣ Cyclic (Alternativa)

**Plano Grátis:**
- 3 apps
- Serverless (AWS Lambda)
- **Limitação:** Cold starts

**Deploy:**
1. [cyclic.sh](https://cyclic.sh)
2. Link GitHub
3. Selecionar repo
4. Deploy automático

---

## 📊 Comparação Gratuita

| Plataforma | RAM | Apps | Sempre Online | Deploy |
|------------|-----|------|---------------|--------|
| **Fly.io** | 256MB | 3 | ✅ | CLI |
| **Koyeb** | 512MB | 1 | ✅ | Dashboard |
| **Adaptable** | 512MB | ∞ | ✅ | Dashboard |
| **Zeabur** | Variable | 3 | ✅ | Dashboard |

**Recomendação:** 
- **Melhor geral:** Fly.io (3 apps, estável)
- **Mais RAM:** Koyeb ou Adaptable (512MB)
- **Mais fácil:** Koyeb (sem CLI)

---

## 🚀 Deploy Rápido - Fly.io (5 min)

```bash
# 1. Instalar
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 2. Login
fly auth login

# 3. Criar app
fly launch --no-deploy

# 4. Secrets
fly secrets set DATABASE_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
fly secrets set DIRECT_URL="postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"

# 5. Deploy
fly deploy

# 6. Ver app
fly open
```

---

## 🔄 Deploy Contínuo (Grátis)

Todas as plataformas acima têm **deploy automático do GitHub**:

```bash
git add .
git commit -m "update"
git push
# → Deploy automático
```

---

## 💡 Dica: Combinar Plataformas

Como são grátis, podes usar **várias ao mesmo tempo**:

- **Fly.io:** Produção principal
- **Koyeb:** Backup/teste
- **Adaptable:** Desenvolvimento

Total: **0 custo** 🎉

---

## 🆘 Troubleshooting

**Build falha no Fly.io:**
```bash
# Aumentar timeout
fly deploy --build-timeout 600
```

**App não inicia:**
- Verifica logs: `fly logs`
- Testa health: `https://[app].fly.dev/api/health`

**Database não conecta:**
- Confirma `DATABASE_URL` com `?sslmode=require`
- Verifica IP whitelist na Neon (deve permitir todos)

---

## 📝 Checklist Deploy Grátis

- [ ] Conta Fly.io criada
- [ ] Fly CLI instalado
- [ ] `DATABASE_URL` e `DIRECT_URL` prontas
- [ ] `fly launch` executado
- [ ] Secrets configurados
- [ ] `fly deploy` funcionou
- [ ] App online: `fly open`

**Tempo total:** 5-10 minutos do zero! 🚀
