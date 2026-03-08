# 🚀 Guia de Deploy - EntregasMoz

> **💡 Quer opção grátis?** Veja [DEPLOY-GRATIS.md](DEPLOY-GRATIS.md)

## Opções de Hospedagem Cloud Pagas

### 1️⃣ Railway (Hobby $5/mês)

**Passos:**
1. Criar conta em [railway.app](https://railway.app)
2. Instalar Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Login e deploy:
   ```bash
   railway login
   railway init
   railway up
   ```
4. Adicionar variáveis de ambiente no Dashboard Railway:
   - `DATABASE_URL` (copiar da Neon - pooler)
   - `DIRECT_URL` (copiar da Neon - direct)
   - `NODE_ENV=production`
5. Deploy automático está configurado!

**Custo:** Grátis até $5/mês de uso, depois paga o que usar.

---

### 2️⃣ Fly.io (Mais Controle)

**Passos:**
1. Instalar Fly CLI:
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```
2. Login e criar app:
   ```bash
   fly auth login
   fly launch --no-deploy
   ```
3. Adicionar secrets (variáveis de ambiente):
   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set DIRECT_URL="postgresql://..."
   ```
4. Deploy:
   ```bash
   fly deploy
   ```
5. Abrir app:
   ```bash
   fly open
   ```

**Custo:** Grátis até 3 apps, depois ~$1.94/mês por app.

---

### 3️⃣ DigitalOcean App Platform

**Passos:**
1. Criar conta em [DigitalOcean](https://cloud.digitalocean.com)
2. Dashboard → Apps → Create App
3. Conectar repositório GitHub/GitLab
4. Configurar:
   - **Build Command:** `npm run build`
   - **Run Command:** `npm start`
   - **Port:** 3000
5. Adicionar variáveis de ambiente:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NODE_ENV=production`
6. Deploy!

**Custo:** A partir de $5/mês (Basic).

---

### 4️⃣ Netlify (Alternativa ao Vercel)

**Passos:**
1. Criar conta em [netlify.com](https://www.netlify.com)
2. Dashboard → Add new site → Import from Git
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
4. Variáveis de ambiente:
   - `DATABASE_URL`
   - `DIRECT_URL`
5. Deploy!

**Custo:** Grátis até 100 GB bandwidth/mês.

---

### 5️⃣ AWS Lightsail (VPS Simples)

**Passos:**
1. Criar conta [AWS Lightsail](https://lightsail.aws.amazon.com)
2. Criar instância Node.js
3. SSH na máquina:
   ```bash
   ssh ubuntu@[IP]
   ```
4. Instalar dependências:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   git clone [seu-repo]
   cd entregasmoz
   npm install
   ```
5. Configurar variáveis:
   ```bash
   echo 'DATABASE_URL="postgresql://..."' > .env
   echo 'DIRECT_URL="postgresql://..."' >> .env
   ```
6. Rodar com PM2:
   ```bash
   sudo npm install -g pm2
   npm run build
   pm2 start npm --name "entregasmoz" -- start
   pm2 startup
   pm2 save
   ```

**Custo:** A partir de $3.50/mês (512 MB RAM).

---

## ✅ Checklist Antes do Deploy

- [ ] Base de dados Neon configurada
- [ ] `DATABASE_URL` e `DIRECT_URL` prontas
- [ ] `npm run build` funciona localmente
- [ ] Dockerfile testado (opcional)
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] Domínio customizado (opcional)

---

## 🔐 Variáveis de Ambiente Necessárias

```bash
DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
NODE_ENV="production"
```

---

## 🆘 Troubleshooting

**Erro: "Prisma Client not found"**
```bash
npx prisma generate
npm run build
```

**Erro: "Cannot connect to database"**
- Verifica se `DATABASE_URL` está correto
- Testa conexão: `npx prisma db push`

**App não inicia:**
- Verifica logs da plataforma
- Confirma que porta 3000 está exposta
- Verifica se `npm start` funciona localmente

---

## 📊 Comparação Rápida

| Plataforma | Facilidade | Custo/mês | Docker | CI/CD |
|------------|-----------|-----------|--------|-------|
| Railway | ⭐⭐⭐⭐⭐ | $0-5 | ✅ | ✅ |
| Fly.io | ⭐⭐⭐⭐ | $0-2 | ✅ | ✅ |
| DigitalOcean | ⭐⭐⭐⭐ | $5+ | ✅ | ✅ |
| Netlify | ⭐⭐⭐⭐⭐ | $0 | ❌ | ✅ |
| AWS Lightsail | ⭐⭐⭐ | $3.50+ | Manual | Manual |

**Recomendação:** Railway para começar, Fly.io para mais controle.
