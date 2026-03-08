# 🚀 Deploy Rápido - Vercel & Render

## ▲ Vercel (2 minutos)

### Via Dashboard
1. [vercel.com](https://vercel.com) → Import Project
2. Conectar GitHub repo
3. Framework: Next.js (detecta automático)
4. Environment Variables:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require
   DIRECT_URL=postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require
   ```
5. Deploy!

### Via CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Plano Grátis:**
- 100 GB bandwidth
- Serverless Functions
- Domínio automático

---

## 🎨 Render (3 minutos)

### Via Dashboard
1. [render.com](https://render.com) → New Web Service
2. Conectar GitHub repo
3. Settings:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
4. Environment Variables:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require
   DIRECT_URL=postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require
   NODE_ENV=production
   ```
5. Deploy!

**Plano Grátis:**
- 512MB RAM
- Hiberna após 15 min inatividade
- Acordar leva ~30s

---

## ⚡ Comparação

| Feature | Vercel | Render |
|---------|--------|--------|
| RAM | Serverless | 512MB |
| Hibernação | Não | Sim (15 min) |
| Deploy | 1-2 min | 3-5 min |
| Bandwidth | 100GB | 100GB |
| Melhor para | Next.js | Apps gerais |

**Recomendação:** Vercel para Next.js (mais otimizado).

---

**Arquivos prontos:**
- `vercel.json` ✅
- `render.yaml` ✅
- Variáveis já configuradas ✅

**Bom descanso! 😴**
