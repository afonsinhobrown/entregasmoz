# 🚀 EntregasMoz - Sistema de Entregas

Sistema de entregas estilo iFood/Uber Eats para Moçambique.

---

## 📋 Requisitos

Antes de começar, você precisa ter instalado no seu computador:

- **Node.js** (versão 18 ou superior) - [Download aqui](https://nodejs.org/)
- **Um editor de código** (recomendado: VS Code) - [Download aqui](https://code.visualstudio.com/)

---

## 🛠️ Como Rodar o Projeto

### Opção A: Banco Cloud (Neon, sem Supabase) - Recomendado
1. Crie uma base PostgreSQL na Neon.
2. Copie a connection string e coloque em `DATABASE_URL` no arquivo `.env`.
3. Defina também `DIRECT_URL` com a conexão direta (sem pool), se disponível.
4. Execute:

```bash
npm run db:generate
npm run db:deploy
npm run seed
```

Exemplo de `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/DB_NAME?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/DB_NAME?sslmode=require"
```

### Passo 1: Descompactar
Descompacte o arquivo `entregasmoz.zip` em uma pasta no seu computador.

### Passo 2: Abrir no Terminal
Abra o terminal (CMD ou PowerShell no Windows) na pasta descompactada.

### Passo 3: Instalar Dependências
```bash
npm install
```

### Passo 4: Configurar Banco de Dados
```bash
npx prisma generate
npx prisma db push
```

### Passo 5: Criar Dados de Exemplo
```bash
npm run seed
```

### Passo 6: Rodar o Servidor
```bash
npm run dev
```

### Passo 7: Acessar no Browser
Abra seu navegador e acesse:
```
http://localhost:3000
```

---

## 👤 Contas de Teste

**Senha para todas:** `123456`

| Tipo | Email | O que pode fazer |
|------|-------|------------------|
| 👤 Cliente | `ana@email.com` | Ver fornecedores, fazer pedidos |
| 🏍️ Entregador | `joao@email.com` | Aceitar entregas, ganhar dinheiro |
| 🏍️ Entregador | `maria@email.com` | Aceitar entregas, ganhar dinheiro |
| 🏪 Restaurante | `sabor@email.com` | Gerenciar produtos, ver pedidos |
| 🏪 Pizzaria | `italia@email.com` | Gerenciar produtos, ver pedidos |
| 🏪 Mercado | `fresco@email.com` | Gerenciar produtos, ver pedidos |

---

## 🎯 Como Testar o Sistema

### Teste como CLIENTE:
1. Login: `ana@email.com` / `123456`
2. Clique em um fornecedor para ver produtos
3. Adicione produtos ao carrinho
4. Vá no carrinho e clique "Fazer Pedido"
5. Acompanhe o status do pedido

### Teste como FORNECEDOR:
1. Login: `sabor@email.com` / `123456`
2. Vá em "Produtos" para adicionar/remover produtos
3. Vá em "Pedidos" para ver e gerenciar pedidos
4. Atualize o status: Confirmar → Preparando → Pronto

### Teste como ENTREGADOR:
1. Login: `joao@email.com` / `123456`
2. Ative o switch "Online" para ficar disponível
3. Veja as entregas disponíveis
4. Aceite uma entrega
5. Confirme retirada e depois a entrega

---

## ⚠️ Problemas Comuns

### Erro: "npx não é reconhecido"
Instale o Node.js: https://nodejs.org/

### Erro: "tsx não encontrado"
```bash
npm install tsx --save-dev
```

### Tela branca ou erro no browser
1. Pare o servidor (Ctrl+C)
2. Delete a pasta `.next`
3. Rode novamente: `npm run dev`

### Login não funciona
Rode novamente o seed:
```bash
npm run seed
```

---

## 🔧 Tecnologias Usadas

- **Next.js 15** - Framework web
- **React** - Biblioteca de interface
- **TypeScript** - Linguagem de programação
- **Tailwind CSS** - Estilização
- **Prisma** - Banco de dados
- **PostgreSQL (Cloud)** - Banco de dados em produção
- **shadcn/ui** - Componentes bonitos

---

## 🌐 Deploy para Produção (100% Grátis)

### ⚡ Deploy Rápido com Fly.io (5 minutos)

**Opção 1 - Scripts Automáticos:**
```bash
# Setup inicial (só uma vez)
.\setup-fly.ps1

# Deploy
.\deploy-fly.ps1
```

**Opção 2 - Manual:**
```bash
# Instalar CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login e setup
fly auth login
fly launch --no-deploy
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set DIRECT_URL="postgresql://..."

# Deploy
fly deploy
fly open
```

📖 **Guia completo:** [FLY.md](FLY.md)

### 🆓 Outras Opções Gratuitas

Ver [DEPLOY-GRATIS.md](DEPLOY-GRATIS.md):
- **Fly.io** - 3 apps, 256MB RAM (Recomendado)
- **Koyeb** - 1 app, 512MB RAM
- **Adaptable** - Apps ilimitadas
- **Zeabur** - $5 crédito/mês

### 💰 Opções Pagas

Ver [DEPLOY.md](DEPLOY.md):
- DigitalOcean, AWS Lightsail, outros

---

**Bom proveito! 🚀**
