# 🚂 Deploy Rápido com Railway

## Opção 1: Via Dashboard (Mais Simples)

1. **Criar conta:** [railway.app/new](https://railway.app/new)

2. **Novo Projeto:**
   - Click "New Project"
   - Seleciona "Deploy from GitHub repo"
   - Autoriza Railway no teu GitHub
   - Seleciona o repositório `entregasmoz`

3. **Configurar Variáveis:**
   - No dashboard do projeto → Settings → Variables
   - Adiciona:
     ```
     DATABASE_URL=postgresql://neondb_owner:npg_xxx@ep-xxx-pooler...
     DIRECT_URL=postgresql://neondb_owner:npg_xxx@ep-xxx...
     NODE_ENV=production
     ```

4. **Deploy Automático:**
   - Railway detecta o Dockerfile
   - Build e deploy acontecem automaticamente
   - Aguarda ~3-5 minutos

5. **Abrir App:**
   - Settings → Generate Domain
   - Click no link gerado

**Pronto! App online em ~5 minutos.**

---

## Opção 2: Via CLI (Mais Controle)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar projeto
railway init

# 4. Adicionar variáveis (importante!)
railway variables set DATABASE_URL="postgresql://..."
railway variables set DIRECT_URL="postgresql://..."
railway variables set NODE_ENV="production"

# 5. Deploy
railway up

# 6. Abrir no browser
railway open
```

---

## 🔄 Deploy Contínuo

Após configuração inicial, **cada push no GitHub faz deploy automático:**

```bash
git add .
git commit -m "Nova feature"
git push
# → Railway faz deploy automaticamente
```

---

## 💰 Custo

- **Hobby Plan (Gratuito):** $5 de crédito/mês
- **Developer Plan:** $5/mês + $0.000463/GB-hora RAM

**Estimativa para esta app:** ~$2-3/mês em uso real.

---

## 🆘 Troubleshooting

**Build falha:**
- Verifica se `Dockerfile` está no root
- Verifica logs: Dashboard → Deployments → Click no deploy → View Logs

**App não inicia:**
- Verifica variáveis de ambiente
- Testa localmente: `docker build -t test . && docker run -p 3000:3000 test`

**Database connection error:**
- Confirma que `DATABASE_URL` está correto (com `?sslmode=require`)
- Testa conexão: `npx prisma db push`

---

## 📊 Monitoramento

**Dashboard Railway mostra:**
- CPU/RAM usage
- Deploy history
- Logs em tempo real
- Métricas de tráfego

**Health Check:** `https://[seu-app].railway.app/api/health`

---

**Tempo total:** 5-10 minutos do zero ao deploy! 🚀
