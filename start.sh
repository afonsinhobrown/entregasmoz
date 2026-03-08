#!/bin/sh
set -e

echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo "🚀 Iniciando aplicação..."
exec node server.js
