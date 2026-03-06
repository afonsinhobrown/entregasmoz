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

// Licenças padrão
const licenses = [
  {
    name: 'Licença Mensal',
    type: 'MONTHLY',
    priceProvider: 1500,
    priceDelivery: 500,
    durationDays: 30,
    description: 'Licença válida por 1 mês',
  },
  {
    name: 'Licença Semestral',
    type: 'SEMESTRAL',
    priceProvider: 7500,
    priceDelivery: 2500,
    durationDays: 180,
    description: 'Licença válida por 6 meses - 17% de desconto',
  },
  {
    name: 'Licença Anual',
    type: 'ANNUAL',
    priceProvider: 12000,
    priceDelivery: 4000,
    durationDays: 365,
    description: 'Licença válida por 1 ano - 33% de desconto',
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

  // Criar prestadores de exemplo com licença
  console.log('🏪 Criando prestadores de exemplo...');
  const annualLicense = await prisma.license.findFirst({
    where: { type: 'ANNUAL' },
  });
  
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
    licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 1);
    
    await prisma.provider.create({
      data: {
        userId: providerUser.id,
        storeName: p.storeName,
        category: p.category,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        isOpen: true,
        licenseId: annualLicense?.id,
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

  // Criar entregadores de exemplo com licença e QR Code
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
    licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 1);
    
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
        licenseId: annualLicense?.id,
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
  console.log(`  - ${licenses.length} licenças configuradas`);
  console.log(`  - ${allProviders.length} prestadores de exemplo`);
  console.log(`  - 3 entregadores de exemplo (com QR Code único)`);
  console.log(`  - 1 cliente de exemplo (cliente@teste.com / 123456)`);
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
