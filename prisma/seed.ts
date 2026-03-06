import { PrismaClient, VehicleType } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const MAPUTO_CENTER = {
  latitude: -25.9653,
  longitude: 32.5892,
};

async function main() {
  console.log('Iniciando seed...');

  // Verificar se já existe dados
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Banco já possui dados. Limpando...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.client.deleteMany();
    await prisma.deliveryPerson.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.user.deleteMany();
    console.log('Dados limpos.');
  }

  // Criar entregadores
  console.log('Criando entregadores...');
  const deliveryPerson1 = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@email.com',
      password: hashPassword('123456'),
      phone: '+258 84 123 4567',
      userType: 'DELIVERY_PERSON',
      deliveryPerson: {
        create: {
          vehicleType: VehicleType.MOTORCYCLE,
          plateNumber: 'MCT-1234',
          isAvailable: true,
          currentLatitude: MAPUTO_CENTER.latitude + 0.01,
          currentLongitude: MAPUTO_CENTER.longitude - 0.01,
          rating: 4.8,
          totalDeliveries: 150,
        },
      },
    },
  });

  const deliveryPerson2 = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@email.com',
      password: hashPassword('123456'),
      phone: '+258 84 765 4321',
      userType: 'DELIVERY_PERSON',
      deliveryPerson: {
        create: {
          vehicleType: VehicleType.MOTORCYCLE,
          plateNumber: 'MCT-5678',
          isAvailable: true,
          currentLatitude: MAPUTO_CENTER.latitude - 0.02,
          currentLongitude: MAPUTO_CENTER.longitude + 0.02,
          rating: 4.9,
          totalDeliveries: 200,
        },
      },
    },
  });

  console.log('Entregadores criados:', deliveryPerson1.email, deliveryPerson2.email);

  // Criar fornecedores
  console.log('Criando fornecedores...');
  const provider1 = await prisma.user.create({
    data: {
      name: 'Restaurante Sabor',
      email: 'sabor@email.com',
      password: hashPassword('123456'),
      phone: '+258 21 123 456',
      userType: 'PROVIDER',
      provider: {
        create: {
          storeName: 'Restaurante Sabor Africano',
          storeDescription: 'Comida tradicional moçambicana e pratos à la carte. Especialidades: Matapa, Galinha à Zambeziana, Camarão.',
          category: 'Restaurante',
          address: 'Av. Samora Machel, 123, Maputo',
          latitude: MAPUTO_CENTER.latitude + 0.005,
          longitude: MAPUTO_CENTER.longitude + 0.003,
          isOpen: true,
        },
      },
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      name: 'Pizzaria Italia',
      email: 'italia@email.com',
      password: hashPassword('123456'),
      phone: '+258 21 654 321',
      userType: 'PROVIDER',
      provider: {
        create: {
          storeName: 'Pizzaria Bella Italia',
          storeDescription: 'Autêntica pizza italiana feita em forno a lenha. Massa artesanal e ingredientes frescos.',
          category: 'Pizzaria',
          address: 'Rua da Bagamoyo, 456, Maputo',
          latitude: MAPUTO_CENTER.latitude - 0.008,
          longitude: MAPUTO_CENTER.longitude - 0.005,
          isOpen: true,
        },
      },
    },
  });

  const provider3 = await prisma.user.create({
    data: {
      name: 'Supermercado Fresco',
      email: 'fresco@email.com',
      password: hashPassword('123456'),
      phone: '+258 21 111 222',
      userType: 'PROVIDER',
      provider: {
        create: {
          storeName: 'Supermercado Fresco',
          storeDescription: 'Frutas, legumes e produtos frescos todos os dias. Entrega rápida em toda Maputo.',
          category: 'Mercado',
          address: 'Av. Julius Nyerere, 789, Maputo',
          latitude: MAPUTO_CENTER.latitude + 0.012,
          longitude: MAPUTO_CENTER.longitude - 0.007,
          isOpen: true,
        },
      },
    },
  });

  console.log('Fornecedores criados:', provider1.email, provider2.email, provider3.email);

  // Buscar os IDs dos providers
  const provider1Data = await prisma.provider.findFirst({ where: { userId: provider1.id } });
  const provider2Data = await prisma.provider.findFirst({ where: { userId: provider2.id } });
  const provider3Data = await prisma.provider.findFirst({ where: { userId: provider3.id } });

  if (!provider1Data || !provider2Data || !provider3Data) {
    throw new Error('Erro ao buscar providers');
  }

  // Criar produtos para o Restaurante Sabor
  console.log('Criando produtos...');
  await prisma.product.createMany({
    data: [
      {
        providerId: provider1Data.id,
        name: 'Matapa',
        description: 'Tradicional matapa de folhas de mandioca com camarão e leite de coco',
        price: 350,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Galinha à Zambeziana',
        description: 'Frango grelhado com molho piri-piri e acompanhamentos',
        price: 420,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Camarão Grelhado',
        description: 'Camarões frescos grelhados com manteiga de alho',
        price: 650,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Xima',
        description: 'Pasta de milho tradicional moçambicana',
        price: 50,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Coca-Cola 500ml',
        description: 'Refrigerante Coca-Cola gelado',
        price: 60,
        isAvailable: true,
      },
    ],
  });

  // Produtos para a Pizzaria
  await prisma.product.createMany({
    data: [
      {
        providerId: provider2Data.id,
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mozzarella fresca e manjericão',
        price: 380,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Pizza Quattro Formaggi',
        description: 'Mozzarella, gorgonzola, parmesão e queijo de cabra',
        price: 450,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Pizza Pepperoni',
        description: 'Molho de tomate, mozzarella e pepperoni',
        price: 420,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Calzone',
        description: 'Pizza fechada recheada com presunto, queijo e cogumelos',
        price: 400,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Lasanha à Bolonhesa',
        description: 'Lasanha tradicional com molho bolonhesa e bechamel',
        price: 350,
        isAvailable: true,
      },
    ],
  });

  // Produtos para o Supermercado
  await prisma.product.createMany({
    data: [
      {
        providerId: provider3Data.id,
        name: 'Cesta de Frutas',
        description: 'Mix de frutas frescas da estação (maçã, banana, laranja, manga)',
        price: 250,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Legumes Sortidos',
        description: 'Kit com tomate, alface, cenoura, cebola e batata',
        price: 180,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Pão Caseiro',
        description: 'Pão artesanal recém-assado',
        price: 80,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Ovos (dúzia)',
        description: 'Ovos frescos de galinha caipira',
        price: 150,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Leite Fresco (1L)',
        description: 'Leite integral fresco pasteurizado',
        price: 90,
        isAvailable: true,
      },
    ],
  });

  // Criar cliente
  console.log('Criando cliente...');
  const client = await prisma.user.create({
    data: {
      name: 'Ana Costa',
      email: 'ana@email.com',
      password: hashPassword('123456'),
      phone: '+258 84 999 8888',
      userType: 'CLIENT',
      client: {
        create: {
          address: 'Av. 25 de Setembro, 100, Maputo',
          latitude: MAPUTO_CENTER.latitude,
          longitude: MAPUTO_CENTER.longitude,
        },
      },
    },
  });

  console.log('Cliente criado:', client.email);

  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('═══════════════════════════════════════════');
  console.log('📋 CONTAS DE TESTE (senha: 123456)');
  console.log('═══════════════════════════════════════════');
  console.log('\n👤 CLIENTES:');
  console.log('   ana@email.com');
  console.log('\n🏍️ ENTREGADORES:');
  console.log('   joao@email.com');
  console.log('   maria@email.com');
  console.log('\n🏪 FORNECEDORES:');
  console.log('   sabor@email.com (Restaurante)');
  console.log('   italia@email.com (Pizzaria)');
  console.log('   fresco@email.com (Supermercado)');
  console.log('═══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
