# Dockerfile otimizado para Next.js com Prisma
FROM node:20-alpine AS base

# Instalar dependências necessárias para Prisma
RUN apk add --no-cache libc6-compat openssl

# Stage 1: Dependências
FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build do Next.js
RUN npm run build

# Stage 3: Runner (produção)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/start.sh ./start.sh

RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3000

CMD ["./start.sh"]
