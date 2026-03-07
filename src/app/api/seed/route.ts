import { db } from '@/lib/db';
import { hash } from 'crypto';
import { NextResponse } from 'next/server';

function hashPassword(password: string): string {
  return hash('sha256', password);
}

// Maputo coordinates
const MAPUTO_CENTER = {
  latitude: -25.9653,
  longitude: 32.5892,
};

export async function POST() {
  try {
    // Check if already seeded
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ message: 'Database already seeded' });
    }

    // Create sample data
    await db.$transaction(async (tx) => {
      // Create delivery persons
      const deliveryPerson1 = await tx.user.create({
        data: {
          name: 'João Silva',
          email: 'joao@email.com',
          password: hashPassword('123456'),
          phone: '+258 84 123 4567',
          userType: 'DELIVERY_PERSON',
          deliveryPerson: {
            create: {
              vehicleType: 'MOTORCYCLE',
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

      const deliveryPerson2 = await tx.user.create({
        data: {
          name: 'Maria Santos',
          email: 'maria@email.com',
          password: hashPassword('123456'),
          phone: '+258 84 765 4321',
          userType: 'DELIVERY_PERSON',
          deliveryPerson: {
            create: {
              vehicleType: 'MOTORCYCLE',
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

      // Create providers
      const provider1 = await tx.user.create({
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

      const provider2 = await tx.user.create({
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

      const provider3 = await tx.user.create({
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

      // Create products for provider 1 (Restaurante Sabor)
      await tx.product.createMany({
        data: [
          {
            providerId: provider1.provider!.id,
            name: 'Matapa',
            description: 'Tradicional matapa de folhas de mandioca com camarão e leite de coco',
            price: 350,
            isAvailable: true,
          },
          {
            providerId: provider1.provider!.id,
            name: 'Galinha à Zambeziana',
            description: 'Frango grelhado com molho piri-piri e acompanhamentos',
            price: 420,
            isAvailable: true,
          },
          {
            providerId: provider1.provider!.id,
            name: 'Camarão Grelhado',
            description: 'Camarões frescos grelhados com manteiga de alho',
            price: 650,
            isAvailable: true,
          },
          {
            providerId: provider1.provider!.id,
            name: 'Xima',
            description: 'Pasta de milho tradicional moçambicana',
            price: 50,
            isAvailable: true,
          },
          {
            providerId: provider1.provider!.id,
            name: 'Salada Tropical',
            description: 'Mix de folhas verdes, tomate, pepino e molho especial',
            price: 180,
            isAvailable: true,
          },
        ],
      });

      // Create products for provider 2 (Pizzaria)
      await tx.product.createMany({
        data: [
          {
            providerId: provider2.provider!.id,
            name: 'Pizza Margherita',
            description: 'Molho de tomate, mozzarella fresca e manjericão',
            price: 380,
            isAvailable: true,
          },
          {
            providerId: provider2.provider!.id,
            name: 'Pizza Quattro Formaggi',
            description: 'Mozzarella, gorgonzola, parmesão e queijo de cabra',
            price: 450,
            isAvailable: true,
          },
          {
            providerId: provider2.provider!.id,
            name: 'Pizza Pepperoni',
            description: 'Molho de tomate, mozzarella e pepperoni',
            price: 420,
            isAvailable: true,
          },
          {
            providerId: provider2.provider!.id,
            name: 'Calzone',
            description: 'Pizza fechada recheada com presunto, queijo e cogumelos',
            price: 400,
            isAvailable: true,
          },
          {
            providerId: provider2.provider!.id,
            name: 'Lasanha à Bolonhesa',
            description: 'Lasanha tradicional com molho bolonhesa e bechamel',
            price: 350,
            isAvailable: true,
          },
        ],
      });

      // Create products for provider 3 (Supermercado)
      await tx.product.createMany({
        data: [
          {
            providerId: provider3.provider!.id,
            name: 'Cesta de Frutas',
            description: 'Mix de frutas frescas da estação (maçã, banana, laranja, manga)',
            price: 250,
            isAvailable: true,
          },
          {
            providerId: provider3.provider!.id,
            name: 'Legumes Sortidos',
            description: 'Kit com tomate, alface, cenoura, cebola e batata',
            price: 180,
            isAvailable: true,
          },
          {
            providerId: provider3.provider!.id,
            name: 'Pão Caseiro',
            description: 'Pão artesanal recém-assado',
            price: 80,
            isAvailable: true,
          },
          {
            providerId: provider3.provider!.id,
            name: 'Ovos (dúzia)',
            description: 'Ovos frescos de galinha caipira',
            price: 150,
            isAvailable: true,
          },
          {
            providerId: provider3.provider!.id,
            name: 'Leite Fresco (1L)',
            description: 'Leite integral fresco pasteurizado',
            price: 90,
            isAvailable: true,
          },
        ],
      });

      // Create sample client
      const client = await tx.user.create({
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

      // Store user IDs for response
      return {
        deliveryPersons: [deliveryPerson1.id, deliveryPerson2.id],
        providers: [provider1.id, provider2.id, provider3.id],
        client: client.id,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      sampleAccounts: {
        clients: [{ email: 'ana@email.com', password: '123456' }],
        deliveryPersons: [
          { email: 'joao@email.com', password: '123456' },
          { email: 'maria@email.com', password: '123456' },
        ],
        providers: [
          { email: 'sabor@email.com', password: '123456' },
          { email: 'italia@email.com', password: '123456' },
          { email: 'fresco@email.com', password: '123456' },
        ],
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar dados de exemplo' },
      { status: 500 }
    );
  }
}
