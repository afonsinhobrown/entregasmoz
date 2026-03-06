import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Gerar QR Code único
function generateQRCode(prefix: string): string {
  const random = randomBytes(8).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${random}-${timestamp}`;
}

// Cidades de Moçambique
const cities = [
  // Capitais de Província
  { name: 'Maputo', province: 'Maputo Cidade', latitude: -25.9653, longitude: 32.5892 },
  { name: 'Matola', province: 'Maputo Província', latitude: -25.9622, longitude: 32.4589 },
  { name: 'Xai-Xai', province: 'Gaza', latitude: -25.0519, longitude: 33.6436 },
  { name: 'Inhambane', province: 'Inhambane', latitude: -23.8650, longitude: 35.3833 },
  { name: 'Beira', province: 'Sofala', latitude: -19.8436, longitude: 34.8389 },
  { name: 'Chimoio', province: 'Manica', latitude: -19.1164, longitude: 33.4833 },
  { name: 'Tete', province: 'Tete', latitude: -16.1564, longitude: 33.5867 },
  { name: 'Quelimane', province: 'Zambézia', latitude: -17.8786, longitude: 36.8883 },
  { name: 'Nampula', province: 'Nampula', latitude: -15.1166, longitude: 39.2666 },
  { name: 'Pemba', province: 'Cabo Delgado', latitude: -12.9776, longitude: 40.5167 },
  { name: 'Lichinga', province: 'Niassa', latitude: -13.3128, longitude: 35.2422 },
  
  // Cidades da Província de Maputo
  { name: 'Boane', province: 'Maputo Província', latitude: -26.0447, longitude: 32.3333 },
  { name: 'Namaacha', province: 'Maputo Província', latitude: -26.0167, longitude: 32.0333 },
  { name: 'Moamba', province: 'Maputo Província', latitude: -25.6000, longitude: 32.2500 },
  { name: 'Magude', province: 'Maputo Província', latitude: -25.0333, longitude: 32.6500 },
  { name: 'Manhiça', province: 'Maputo Província', latitude: -25.4117, longitude: 32.8067 },
  { name: 'Marracuene', province: 'Maputo Província', latitude: -25.7167, longitude: 32.6833 },
  { name: 'Matutuíne', province: 'Maputo Província', latitude: -26.2000, longitude: 32.8500 },
  { name: 'Bela Vista', province: 'Maputo Província', latitude: -26.1000, longitude: 32.9000 },
];

// Licenças - Planos para Prestadores e Entregadores
const licenses = [
  // =====================
  // TRIAL - 10 dias renovável (Admin decide se é free ou pago)
  // =====================
  {
    name: 'Trial (10 dias)',
    type: 'TRIAL',
    targetUserType: 'BOTH',
    priceProvider: 0,      // Admin pode definir como free ou pago
    priceDelivery: 0,      // Admin pode definir como free ou pago
    durationDays: 10,
    description: 'Licença de teste de 10 dias - pode ser renovada. O administrador decide se é gratuita ou paga.',
    isActive: true,
    isTrial: true,
    isFree: true,          // Pode ser alterado pelo admin
    transactionFeePercent: 5,
    ordersIncluded: 20,
    orderExcessFee: 10,
    deliveriesIncluded: 20,
    deliveryExcessFee: 6,
  },
  
  // =====================
  // PLANOS PARA PRESTADORES
  // =====================
  {
    name: 'Starter',
    type: 'STARTER',
    targetUserType: 'PROVIDER',
    priceProvider: 300,
    priceDelivery: 0,
    durationDays: 30,
    description: 'Ideal para negócios novos ou que estão a testar a plataforma. Até 60 pedidos/mês.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 4.5,
    ordersIncluded: 60,
    orderExcessFee: 10,
    productsLimit: 30,
    hasHighlight: false,
  },
  {
    name: 'Grow',
    type: 'GROW',
    targetUserType: 'PROVIDER',
    priceProvider: 750,
    priceDelivery: 0,
    durationDays: 30,
    description: 'O plano âncora, pensado para o volume médio de 51-300 pedidos. Destaque ocasional.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 3,
    ordersIncluded: 200,
    orderExcessFee: 7,
    productsLimit: 150,
    hasHighlight: true,
  },
  {
    name: 'Pro',
    type: 'PRO',
    targetUserType: 'PROVIDER',
    priceProvider: 1500,
    priceDelivery: 0,
    durationDays: 30,
    description: 'Para negócios estabelecidos. Pedidos ilimitados, destaque prioritário e menor taxa.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 1.8,
    ordersIncluded: 999999, // Ilimitado
    orderExcessFee: 0,
    productsLimit: 999999, // Ilimitado
    hasHighlight: true,
    hasPriority: true,
  },
  
  // =====================
  // PLANOS PARA ENTREGADORES
  // =====================
  {
    name: 'Básico',
    type: 'BASIC',
    targetUserType: 'DELIVERY_PERSON',
    priceProvider: 0,
    priceDelivery: 100,
    durationDays: 30,
    description: 'Para entregadores part-time ou a começar. Até 40 entregas/mês.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 7,
    deliveriesIncluded: 40,
    deliveryExcessFee: 6,
    hasPriority: false,
    hasInsurance: false,
  },
  {
    name: 'Ativo',
    type: 'ACTIVE',
    targetUserType: 'DELIVERY_PERSON',
    priceProvider: 0,
    priceDelivery: 250,
    durationDays: 30,
    description: 'O plano principal, para quem faz delivery como atividade principal. Até 180 entregas/mês.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 4.5,
    deliveriesIncluded: 180,
    deliveryExcessFee: 4,
    hasPriority: true,
    hasInsurance: true,
  },
  {
    name: 'Top',
    type: 'TOP',
    targetUserType: 'DELIVERY_PERSON',
    priceProvider: 0,
    priceDelivery: 500,
    durationDays: 30,
    description: 'Para entregadores de alto volume. Entregas ilimitadas, máxima visibilidade e menor taxa.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 2.5,
    deliveriesIncluded: 999999, // Ilimitado
    deliveryExcessFee: 0,
    hasPriority: true,
    hasInsurance: true,
    hasVerifiedBadge: true,
  },
  
  // =====================
  // PLANOS ANUAIS (com desconto de 20%)
  // =====================
  {
    name: 'Starter Anual',
    type: 'STARTER',
    targetUserType: 'PROVIDER',
    priceProvider: 2880, // 300 * 12 * 0.8
    priceDelivery: 0,
    durationDays: 365,
    description: 'Plano Starter anual com 20% de desconto. Economize 720 MZN/ano.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 4.5,
    ordersIncluded: 60,
    orderExcessFee: 10,
    productsLimit: 30,
    hasHighlight: false,
  },
  {
    name: 'Grow Anual',
    type: 'GROW',
    targetUserType: 'PROVIDER',
    priceProvider: 7200, // 750 * 12 * 0.8
    priceDelivery: 0,
    durationDays: 365,
    description: 'Plano Grow anual com 20% de desconto. Economize 1800 MZN/ano.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 3,
    ordersIncluded: 200,
    orderExcessFee: 7,
    productsLimit: 150,
    hasHighlight: true,
  },
  {
    name: 'Pro Anual',
    type: 'PRO',
    targetUserType: 'PROVIDER',
    priceProvider: 14400, // 1500 * 12 * 0.8
    priceDelivery: 0,
    durationDays: 365,
    description: 'Plano Pro anual com 20% de desconto. Economize 3600 MZN/ano.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 1.8,
    ordersIncluded: 999999,
    orderExcessFee: 0,
    productsLimit: 999999,
    hasHighlight: true,
    hasPriority: true,
  },
  {
    name: 'Básico Anual',
    type: 'BASIC',
    targetUserType: 'DELIVERY_PERSON',
    priceProvider: 0,
    priceDelivery: 960, // 100 * 12 * 0.8
    durationDays: 365,
    description: 'Plano Básico anual com 20% de desconto. Economize 240 MZN/ano.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 7,
    deliveriesIncluded: 40,
    deliveryExcessFee: 6,
    hasPriority: false,
    hasInsurance: false,
  },
  {
    name: 'Ativo Anual',
    type: 'ACTIVE',
    targetUserType: 'DELIVERY_PERSON',
    priceProvider: 0,
    priceDelivery: 2400, // 250 * 12 * 0.8
    durationDays: 365,
    description: 'Plano Ativo anual com 20% de desconto. Economize 600 MZN/ano.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 4.5,
    deliveriesIncluded: 180,
    deliveryExcessFee: 4,
    hasPriority: true,
    hasInsurance: true,
  },
  {
    name: 'Top Anual',
    type: 'TOP',
    targetUserType: 'DELIVERY_PERSON',
    priceProvider: 0,
    priceDelivery: 4800, // 500 * 12 * 0.8
    durationDays: 365,
    description: 'Plano Top anual com 20% de desconto. Economize 1200 MZN/ano.',
    isActive: true,
    isTrial: false,
    transactionFeePercent: 2.5,
    deliveriesIncluded: 999999,
    deliveryExcessFee: 0,
    hasPriority: true,
    hasInsurance: true,
    hasVerifiedBadge: true,
  },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar cidades
  console.log('🏙️ Criando cidades...');
  for (const city of cities) {
    await prisma.city.create({
      data: city,
    });
  }

  // Criar administrador
  console.log('👑 Criando administrador...');
  const adminPassword = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'nachingweya@gmail.com',
      password: adminPassword,
      phone: '+258 84 000 0000',
      userType: 'ADMIN',
    },
  });
  await prisma.admin.create({
    data: {
      userId: adminUser.id,
    },
  });

  // Criar licenças
  console.log('📜 Criando licenças...');
  for (const license of licenses) {
    await prisma.license.create({
      data: license,
    });
  }

  // Criar configurações de taxa de entrega
  console.log('💰 Criando configurações de taxa de entrega...');
  const maputoCity = await prisma.city.findFirst({
    where: { name: 'Maputo' },
  });
  
  await prisma.deliveryFeeConfig.create({
    data: {
      cityId: maputoCity?.id,
      baseFee: 50,
      perKmFee: 20,
      minFee: 50,
      maxDistance: 20,
      platformCommissionPercent: 10,
    },
  });

  // Configuração global (fallback)
  await prisma.deliveryFeeConfig.create({
    data: {
      baseFee: 50,
      perKmFee: 20,
      minFee: 50,
      maxDistance: 20,
      platformCommissionPercent: 10,
    },
  });

  // Criar configurações gerais
  console.log('⚙️ Criando configurações...');
  await prisma.setting.createMany({
    data: [
      { key: 'mpesa_number', value: '+258 84 000 0001', description: 'Número M-Pesa para pagamentos' },
      { key: 'emola_number', value: '+258 86 000 0001', description: 'Número e-Mola para pagamentos' },
      { key: 'visa_number', value: '**** **** **** 0001', description: 'Referência Visa para pagamentos' },
      { key: 'premium_monthly_fee', value: '500', description: 'Taxa mensal para destaque premium (MT)' },
      { key: 'platform_name', value: 'EntregasMoz', description: 'Nome da plataforma' },
      { key: 'support_phone', value: '+258 84 000 0000', description: 'Telefone de suporte' },
      { key: 'support_email', value: 'suporte@entregasmoz.co.mz', description: 'Email de suporte' },
    ],
  });

  // Criar usuário cliente de exemplo
  console.log('👤 Criando cliente de exemplo...');
  const clientPassword = await bcrypt.hash('123456', 10);
  const clientUser = await prisma.user.create({
    data: {
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      password: clientPassword,
      phone: '+258 84 111 1111',
      userType: 'CLIENT',
    },
  });
  await prisma.client.create({
    data: {
      userId: clientUser.id,
      address: 'Av. Julius Nyerere, Maputo',
      latitude: -25.9653,
      longitude: 32.5892,
      cityId: maputoCity?.id,
    },
  });

  // Obter licenças para atribuir
  const growLicense = await prisma.license.findFirst({
    where: { type: 'GROW', durationDays: 30 },
  });
  const activeLicense = await prisma.license.findFirst({
    where: { type: 'ACTIVE', durationDays: 30 },
  });

  // Criar prestadores de exemplo com licença
  console.log('🏪 Criando prestadores de exemplo...');
  
  const providers = [
    {
      name: 'Restaurante Zimpeto',
      email: 'zimpeto@restaurante.co.mz',
      storeName: 'Restaurante Zimpeto',
      category: 'Restaurante',
      address: 'Zimpeto, Maputo',
      latitude: -25.9047,
      longitude: 32.5083,
    },
    {
      name: 'Pizzaria Costa do Sol',
      email: 'costasol@pizzaria.co.mz',
      storeName: 'Pizzaria Costa do Sol',
      category: 'Pizzaria',
      address: 'Costa do Sol, Maputo',
      latitude: -25.9658,
      longitude: 32.5901,
    },
    {
      name: 'Mercado Polana',
      email: 'polana@mercado.co.mz',
      storeName: 'Mercado Polana',
      category: 'Mercado',
      address: 'Polana, Maputo',
      latitude: -25.9700,
      longitude: 32.5800,
    },
    {
      name: 'Restaurante Malhangalene',
      email: 'malhangalene@restaurante.co.mz',
      storeName: 'Restaurante Malhangalene',
      category: 'Restaurante',
      address: 'Malhangalene, Maputo',
      latitude: -25.9450,
      longitude: 32.5600,
    },
  ];

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const providerPassword = await bcrypt.hash('123456', 10);
    const providerUser = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        password: providerPassword,
        phone: `+258 84 222 000${i}`,
        userType: 'PROVIDER',
      },
    });
    
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setMonth(licenseExpiresAt.getMonth() + 1);
    
    await prisma.provider.create({
      data: {
        userId: providerUser.id,
        storeName: p.storeName,
        category: p.category,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        isOpen: true,
        licenseId: growLicense?.id,
        licenseExpiresAt: licenseExpiresAt,
        cityId: maputoCity?.id,
      },
    });
  }

  // Criar produtos para cada prestador
  console.log('🍽️ Criando produtos de exemplo...');
  const allProviders = await prisma.provider.findMany();
  
  const productsByCategory: Record<string, Array<{name: string, description: string, price: number}>> = {
    'Restaurante': [
      { name: 'Frango Grelhado', description: 'Frango grelhado com batata frita', price: 350 },
      { name: 'Peixe Frito', description: 'Peixe frito com arroz e salada', price: 400 },
      { name: 'Carne de Porco', description: 'Carne de porco estufada', price: 380 },
      { name: 'Coca-Cola 350ml', description: 'Refrigerante Coca-Cola', price: 50 },
      { name: 'Água Mineral 500ml', description: 'Água mineral natural', price: 30 },
    ],
    'Pizzaria': [
      { name: 'Pizza Margherita', description: 'Pizza com molho de tomate e mozzarella', price: 450 },
      { name: 'Pizza Calabresa', description: 'Pizza com calabresa e cebola', price: 500 },
      { name: 'Pizza Quatro Queijos', description: 'Pizza com 4 tipos de queijo', price: 550 },
      { name: 'Pizza Portuguesa', description: 'Pizza com presunto, ovo e cebola', price: 520 },
      { name: 'Coca-Cola 350ml', description: 'Refrigerante Coca-Cola', price: 50 },
    ],
    'Mercado': [
      { name: 'Pão 10 unidades', description: 'Pão fresco do dia', price: 80 },
      { name: 'Leite 1L', description: 'Leite fresco pasteurizado', price: 90 },
      { name: 'Ovos 12 unidades', description: 'Ovos frescos', price: 150 },
      { name: 'Arroz 1kg', description: 'Arroz tipo 1', price: 80 },
      { name: 'Açúcar 1kg', description: 'Açúcar cristal', price: 70 },
    ],
  };

  for (const provider of allProviders) {
    const products = productsByCategory[provider.category || 'Restaurante'] || productsByCategory['Restaurante'];
    for (const product of products) {
      await prisma.product.create({
        data: {
          providerId: provider.id,
          name: product.name,
          description: product.description,
          price: product.price,
          isAvailable: true,
        },
      });
    }
  }

  // Criar entregadores de exemplo com licença
  console.log('🏍️ Criando entregadores de exemplo...');
  const deliveryLocations = [
    { lat: -25.9100, lng: 32.5200 }, // Zimpeto
    { lat: -25.9700, lng: 32.5900 }, // Costa do Sol
    { lat: -25.9500, lng: 32.5700 }, // Polana
  ];

  const deliveryVehicles = [
    { type: 'MOTORCYCLE', plate: 'MG-1234-MF', color: 'Vermelho', brand: 'Honda CG 150' },
    { type: 'MOTORCYCLE', plate: 'MG-5678-MF', color: 'Azul', brand: 'Yamaha XTZ 150' },
    { type: 'BICYCLE', plate: 'BC-0001-MP', color: 'Verde', brand: 'Mountain Bike' },
  ];

  for (let i = 0; i < 3; i++) {
    const deliveryPassword = await bcrypt.hash('123456', 10);
    const deliveryUser = await prisma.user.create({
      data: {
        name: `Entregador ${i + 1}`,
        email: `entregador${i + 1}@teste.com`,
        password: deliveryPassword,
        phone: `+258 84 333 000${i}`,
        userType: 'DELIVERY_PERSON',
      },
    });
    
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setMonth(licenseExpiresAt.getMonth() + 1);
    
    // Gerar QR Code único para o entregador
    const qrCode = generateQRCode('DEL');
    
    await prisma.deliveryPerson.create({
      data: {
        userId: deliveryUser.id,
        vehicleType: deliveryVehicles[i].type as 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'SCOOTER',
        plateNumber: deliveryVehicles[i].plate,
        vehicleColor: deliveryVehicles[i].color,
        vehicleBrand: deliveryVehicles[i].brand,
        qrCode: qrCode,
        isAvailable: i === 0, // Só o primeiro está disponível por padrão
        currentLatitude: deliveryLocations[i].lat,
        currentLongitude: deliveryLocations[i].lng,
        rating: 4.5 + (i * 0.1),
        totalDeliveries: 10 + (i * 5),
        licenseId: activeLicense?.id,
        licenseExpiresAt: licenseExpiresAt,
        cityId: maputoCity?.id,
      },
    });
    
    console.log(`  ✓ Entregador ${i + 1}: QR Code = ${qrCode}`);
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Resumo:');
  console.log(`  - ${cities.length} cidades criadas`);
  console.log(`  - 1 administrador (nachingweya@gmail.com / 123456)`);
  console.log(`  - ${licenses.length} planos de licença configurados`);
  console.log(`  - ${allProviders.length} prestadores de exemplo (plano Grow)`);
  console.log(`  - 3 entregadores de exemplo (plano Ativo)`);
  console.log(`  - 1 cliente de exemplo (cliente@teste.com / 123456)`);
  console.log('');
  console.log('📦 Planos Disponíveis:');
  console.log('  PRESTADORES: Starter (300 MT), Grow (750 MT), Pro (1500 MT)');
  console.log('  ENTREGADORES: Básico (100 MT), Ativo (250 MT), Top (500 MT)');
  console.log('  TRIAL: 10 dias (gratuito ou pago - admin define)');
  console.log('');
  console.log('🔐 Credenciais de Teste:');
  console.log('  Admin: nachingweya@gmail.com / 123456');
  console.log('  Cliente: cliente@teste.com / 123456');
  console.log('  Entregador 1: entregador1@teste.com / 123456');
  console.log('  Prestador: zimpeto@restaurante.co.mz / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
