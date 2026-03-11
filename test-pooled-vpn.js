const { PrismaClient } = require('@prisma/client');

const testPooledConnection = async () => {
    const db = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://neondb_owner:npg_4LY2caWCfsHM@ep-raspy-mode-agdi8d9m-pooler.c-2.eu-central-1.aws.neon.tech/entregasmoz?sslmode=require"
            }
        }
    });

    try {
        await db.$connect();
        console.log('✅ Conexão pooled funciona com VPN!');
        const cities = await db.city.findMany({ take: 1 });
        console.log(`Encontradas ${cities.length} cidades`);
    } catch (error) {
        console.log('❌ Conexão pooled falha com VPN:', error.message);
    } finally {
        await db.$disconnect();
    }
};

testPooledConnection();