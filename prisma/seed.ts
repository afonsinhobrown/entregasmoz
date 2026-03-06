import { PrismaClient, VehicleType } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Coordenadas reais de Maputo
const LOCAIS = {
  // Centro de Maputo (Baixa)
  centro: { latitude: -25.9653, longitude: 32.5892 },
  // Zimpeto (zona norte de Maputo)
  zimpeto: { latitude: -25.9047, longitude: 32.5083 },
  // Costa do Sol (Marginal, leste de Maputo)
  costaDoSol: { latitude: -25.9658, longitude: 32.5901 },
  // Polana (zona nobre)
  polana: { latitude: -25.9615, longitude: 32.5887 },
  // Malhangalene (zona residencial)
  malhangalene: { latitude: -25.9489, longitude: 32.5708 },
  // Sommerschield
  sommerschield: { latitude: -25.9544, longitude: 32.5989 },
  // Machava
  machava: { latitude: -25.9311, longitude: 32.4878 },
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

  // Criar entregadores com localizações reais
  console.log('Criando entregadores...');
  
  // Entregador 1 - Em Zimpeto
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
          currentLatitude: LOCAIS.zimpeto.latitude,
          currentLongitude: LOCAIS.zimpeto.longitude,
          rating: 4.8,
          totalDeliveries: 150,
        },
      },
    },
  });

  // Entregador 2 - No Costa do Sol
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
          currentLatitude: LOCAIS.costaDoSol.latitude,
          currentLongitude: LOCAIS.costaDoSol.longitude,
          rating: 4.9,
          totalDeliveries: 200,
        },
      },
    },
  });

  // Entregador 3 - Em Malhangalene
  const deliveryPerson3 = await prisma.user.create({
    data: {
      name: 'Pedro Matsinhe',
      email: 'pedro@email.com',
      password: hashPassword('123456'),
      phone: '+258 84 333 2222',
      userType: 'DELIVERY_PERSON',
      deliveryPerson: {
        create: {
          vehicleType: VehicleType.BICYCLE,
          plateNumber: 'BIC-0001',
          isAvailable: true,
          currentLatitude: LOCAIS.malhangalene.latitude,
          currentLongitude: LOCAIS.malhangalene.longitude,
          rating: 4.7,
          totalDeliveries: 80,
        },
      },
    },
  });

  console.log('Entregadores criados:', deliveryPerson1.email, deliveryPerson2.email, deliveryPerson3.email);

  // Criar fornecedores com localizações reais
  console.log('Criando fornecedores...');
  
  // Restaurante Costa do Sol (real!)
  const provider1 = await prisma.user.create({
    data: {
      name: 'Restaurante Costa do Sol',
      email: 'costasol@email.com',
      password: hashPassword('123456'),
      phone: '+258 21 300 100',
      userType: 'PROVIDER',
      provider: {
        create: {
          storeName: 'Restaurante Costa do Sol',
          storeDescription: 'Famoso restaurante na Marginal de Maputo. Especialidades: Peixe fresco, Camarão, Lagosta, Piri-piri. Vista para o mar.',
          category: 'Restaurante',
          address: 'Av. Marginal, Costa do Sol, Maputo',
          latitude: LOCAIS.costaDoSol.latitude,
          longitude: LOCAIS.costaDoSol.longitude,
          isOpen: true,
        },
      },
    },
  });

  // Restaurante no centro
  const provider2 = await prisma.user.create({
    data: {
      name: 'Restaurante Sabor Africano',
      email: 'sabor@email.com',
      password: hashPassword('123456'),
      phone: '+258 21 123 456',
      userType: 'PROVIDER',
      provider: {
        create: {
          storeName: 'Restaurante Sabor Africano',
          storeDescription: 'Comida tradicional moçambicana. Especialidades: Matapa, Galinha à Zambeziana, Caril de Camarão.',
          category: 'Restaurante',
          address: 'Av. Samora Machel, 123, Baixa, Maputo',
          latitude: LOCAIS.centro.latitude,
          longitude: LOCAIS.centro.longitude,
          isOpen: true,
        },
      },
    },
  });

  // Pizzaria no Polana
  const provider3 = await prisma.user.create({
    data: {
      name: 'Pizzaria Bella Italia',
      email: 'italia@email.com',
      password: hashPassword('123456'),
      phone: '+258 21 654 321',
      userType: 'PROVIDER',
      provider: {
        create: {
          storeName: 'Pizzaria Bella Italia',
          storeDescription: 'Pizza autêntica italiana feita em forno a lenha. Massa artesanal e ingredientes importados.',
          category: 'Pizzaria',
          address: 'Av. Julius Nyerere, Polana, Maputo',
          latitude: LOCAIS.polana.latitude,
          longitude: LOCAIS.polana.longitude,
          isOpen: true,
        },
      },
    },
  });

  // Supermercado em Sommerschield
  const provider4 = await prisma.user.create({
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
          address: 'Av. Kwame Nkrumah, Sommerschield, Maputo',
          latitude: LOCAIS.sommerschield.latitude,
          longitude: LOCAIS.sommerschield.longitude,
          isOpen: true,
        },
      },
    },
  });

  console.log('Fornecedores criados:', provider1.email, provider2.email, provider3.email, provider4.email);

  // Buscar os IDs dos providers
  const provider1Data = await prisma.provider.findFirst({ where: { userId: provider1.id } });
  const provider2Data = await prisma.provider.findFirst({ where: { userId: provider2.id } });
  const provider3Data = await prisma.provider.findFirst({ where: { userId: provider3.id } });
  const provider4Data = await prisma.provider.findFirst({ where: { userId: provider4.id } });

  if (!provider1Data || !provider2Data || !provider3Data || !provider4Data) {
    throw new Error('Erro ao buscar providers');
  }

  // Criar produtos para o Costa do Sol
  console.log('Criando produtos...');
  await prisma.product.createMany({
    data: [
      {
        providerId: provider1Data.id,
        name: 'Peixe Grelhado',
        description: 'Peixe fresco do dia grelhado com molho de limão e alho',
        price: 450,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Camarão à Costa do Sol',
        description: 'Camarões grandes grelhados com molho piri-piri especial',
        price: 750,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Lagosta Greelhada',
        description: 'Lagosta fresca grelhada com manteiga de alho',
        price: 1200,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Frango Piri-Piri',
        description: 'Frango grelhado com molho piri-piri tradicional',
        price: 350,
        isAvailable: true,
      },
      {
        providerId: provider1Data.id,
        name: 'Matapa',
        description: 'Tradicional matapa de folhas de mandioca com camarão',
        price: 320,
        isAvailable: true,
      },
    ],
  });

  // Produtos para o Restaurante Sabor Africano
  await prisma.product.createMany({
    data: [
      {
        providerId: provider2Data.id,
        name: 'Matapa',
        description: 'Tradicional matapa de folhas de mandioca com camarão e leite de coco',
        price: 350,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Galinha à Zambeziana',
        description: 'Frango grelhado com molho piri-piri e acompanhamentos',
        price: 420,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Camarão Grelhado',
        description: 'Camarões frescos grelhados com manteiga de alho',
        price: 650,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
        name: 'Xima',
        description: 'Pasta de milho tradicional moçambicana',
        price: 50,
        isAvailable: true,
      },
      {
        providerId: provider2Data.id,
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
        providerId: provider3Data.id,
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mozzarella fresca e manjericão',
        price: 380,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Pizza Quattro Formaggi',
        description: 'Mozzarella, gorgonzola, parmesão e queijo de cabra',
        price: 450,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Pizza Pepperoni',
        description: 'Molho de tomate, mozzarella e pepperoni',
        price: 420,
        isAvailable: true,
      },
      {
        providerId: provider3Data.id,
        name: 'Calzone',
        description: 'Pizza fechada recheada com presunto, queijo e cogumelos',
        price: 400,
        isAvailable: true,
      },
    ],
  });

  // Produtos para o Supermercado
  await prisma.product.createMany({
    data: [
      {
        providerId: provider4Data.id,
        name: 'Cesta de Frutas',
        description: 'Mix de frutas frescas da estação (maçã, banana, laranja, manga)',
        price: 250,
        isAvailable: true,
      },
      {
        providerId: provider4Data.id,
        name: 'Legumes Sortidos',
        description: 'Kit com tomate, alface, cenoura, cebola e batata',
        price: 180,
        isAvailable: true,
      },
      {
        providerId: provider4Data.id,
        name: 'Pão Caseiro',
        description: 'Pão artesanal recém-assado',
        price: 80,
        isAvailable: true,
      },
      {
        providerId: provider4Data.id,
        name: 'Ovos (dúzia)',
        description: 'Ovos frescos de galinha caipira',
        price: 150,
        isAvailable: true,
      },
    ],
  });

  // Criar cliente no centro
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
          address: 'Av. 25 de Setembro, 100, Baixa, Maputo',
          latitude: LOCAIS.centro.latitude,
          longitude: LOCAIS.centro.longitude,
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
  console.log('   ana@email.com (Baixa, Maputo)');
  console.log('\n🏍️ ENTREGADORES:');
  console.log('   joao@email.com (Zimpeto)');
  console.log('   maria@email.com (Costa do Sol)');
  console.log('   pedro@email.com (Malhangalene)');
  console.log('\n🏪 FORNECEDORES:');
  console.log('   costasol@email.com (Costa do Sol)');
  console.log('   sabor@email.com (Baixa)');
  console.log('   italia@email.com (Polana)');
  console.log('   fresco@email.com (Sommerschield)');
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
