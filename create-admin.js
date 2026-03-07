// Script para criar admin - execute com: node create-admin.js
// NÃO APAGA DADOS EXISTENTES

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando se já existe admin...');
  
  const existingAdmin = await prisma.admin.findFirst();
  
  if (existingAdmin) {
    console.log('✅ Já existe um administrador!');
    const adminUser = await prisma.user.findUnique({
      where: { id: existingAdmin.userId }
    });
    console.log('📧 Email:', adminUser?.email);
    return;
  }

  console.log('👤 Criando administrador...');
  
  // Criar o admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'nachingweya@gmail.com',
      password: hashedPassword,
      phone: '+258 84 000 0000',
      userType: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
    },
  });

  console.log('✅ Admin criado com sucesso!');
  console.log('');
  console.log('🔐 Credenciais:');
  console.log('   Email: nachingweya@gmail.com');
  console.log('   Senha: 123456');
  console.log('');

  // Criar licenças se não existirem
  const existingLicenses = await prisma.license.count();
  
  if (existingLicenses === 0) {
    console.log('📜 Criando licenças...');
    
    const licenses = [
      { name: 'Trial (10 dias)', type: 'TRIAL', targetUserType: 'BOTH', priceProvider: 0, priceDelivery: 0, durationDays: 10, isTrial: true, isFree: true, transactionFeePercent: 5 },
      { name: 'Starter', type: 'STARTER', targetUserType: 'PROVIDER', priceProvider: 300, priceDelivery: 0, durationDays: 30, transactionFeePercent: 4.5, ordersIncluded: 60, orderExcessFee: 10, productsLimit: 30 },
      { name: 'Grow', type: 'GROW', targetUserType: 'PROVIDER', priceProvider: 750, priceDelivery: 0, durationDays: 30, transactionFeePercent: 3, ordersIncluded: 200, orderExcessFee: 7, productsLimit: 150, hasHighlight: true },
      { name: 'Pro', type: 'PRO', targetUserType: 'PROVIDER', priceProvider: 1500, priceDelivery: 0, durationDays: 30, transactionFeePercent: 1.8, ordersIncluded: 999999, orderExcessFee: 0, productsLimit: 999999, hasHighlight: true, hasPriority: true },
      { name: 'Básico', type: 'BASIC', targetUserType: 'DELIVERY_PERSON', priceProvider: 0, priceDelivery: 100, durationDays: 30, transactionFeePercent: 7, deliveriesIncluded: 40, deliveryExcessFee: 6 },
      { name: 'Ativo', type: 'ACTIVE', targetUserType: 'DELIVERY_PERSON', priceProvider: 0, priceDelivery: 250, durationDays: 30, transactionFeePercent: 4.5, deliveriesIncluded: 180, deliveryExcessFee: 4, hasPriority: true, hasInsurance: true },
      { name: 'Top', type: 'TOP', targetUserType: 'DELIVERY_PERSON', priceProvider: 0, priceDelivery: 500, durationDays: 30, transactionFeePercent: 2.5, deliveriesIncluded: 999999, deliveryExcessFee: 0, hasPriority: true, hasInsurance: true, hasVerifiedBadge: true },
    ];

    for (const license of licenses) {
      await prisma.license.create({ data: license });
    }
    console.log('✅ Licenças criadas!');
  }

  // Criar cidades se não existirem
  const existingCities = await prisma.city.count();
  
  if (existingCities === 0) {
    console.log('🏙️ Criando cidades...');
    
    const cities = [
      { name: 'Maputo', province: 'Maputo Cidade', latitude: -25.9653, longitude: 32.5892 },
      { name: 'Matola', province: 'Maputo Província', latitude: -25.9622, longitude: 32.4589 },
      { name: 'Beira', province: 'Sofala', latitude: -19.8436, longitude: 34.8389 },
      { name: 'Nampula', province: 'Nampula', latitude: -15.1166, longitude: 39.2666 },
    ];

    for (const city of cities) {
      await prisma.city.create({ data: city });
    }
    console.log('✅ Cidades criadas!');
  }

  // Criar configurações se não existirem
  const existingSettings = await prisma.setting.count();
  
  if (existingSettings === 0) {
    console.log('⚙️ Criando configurações...');
    
    await prisma.setting.createMany({
      data: [
        { key: 'mpesa_number', value: '+258 84 000 0001', description: 'Número M-Pesa' },
        { key: 'emola_number', value: '+258 86 000 0001', description: 'Número e-Mola' },
        { key: 'platform_name', value: 'EntregasMoz', description: 'Nome da plataforma' },
      ],
    });
    console.log('✅ Configurações criadas!');
  }

  console.log('');
  console.log('🎉 Setup completo! Agora pode fazer login.');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
