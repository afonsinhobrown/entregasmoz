import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

// Criar admin se não existir - NÃO APAGA DADOS EXISTENTES
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Verificar se já existe algum admin
    const existingAdmin = await db.admin.findFirst();
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Já existe um administrador',
        adminExists: true 
      });
    }

    // Verificar se o email já está em uso
    const existingUser = await db.user.findUnique({
      where: { email: email || 'nachingweya@gmail.com' }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Este email já está em uso por outro usuário' 
      }, { status: 400 });
    }

    // Criar o admin
    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    
    const adminUser = await db.user.create({
      data: {
        name: name || 'Administrador',
        email: email || 'nachingweya@gmail.com',
        password: hashedPassword,
        phone: phone || '+258 84 000 0000',
        userType: 'ADMIN',
        isActive: true,
      },
    });

    await db.admin.create({
      data: {
        userId: adminUser.id,
      },
    });

    // Criar licenças se não existirem
    const existingLicenses = await db.license.count();
    
    if (existingLicenses === 0) {
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
        await db.license.create({ data: license });
      }
    }

    // Criar configurações se não existirem
    const existingSettings = await db.setting.count();
    
    if (existingSettings === 0) {
      await db.setting.createMany({
        data: [
          { key: 'mpesa_number', value: '+258 84 000 0001', description: 'Número M-Pesa' },
          { key: 'emola_number', value: '+258 86 000 0001', description: 'Número e-Mola' },
          { key: 'platform_name', value: 'EntregasMoz', description: 'Nome da plataforma' },
        ],
      });
    }

    // Criar cidades se não existirem
    const existingCities = await db.city.count();
    
    if (existingCities === 0) {
      const cities = [
        { name: 'Maputo', province: 'Maputo Cidade', latitude: -25.9653, longitude: 32.5892 },
        { name: 'Matola', province: 'Maputo Província', latitude: -25.9622, longitude: 32.4589 },
        { name: 'Beira', province: 'Sofala', latitude: -19.8436, longitude: 34.8389 },
        { name: 'Nampula', province: 'Nampula', latitude: -15.1166, longitude: 39.2666 },
      ];

      for (const city of cities) {
        await db.city.create({ data: city });
      }
    }

    // Criar taxa de entrega se não existir
    const existingFeeConfig = await db.deliveryFeeConfig.count();
    
    if (existingFeeConfig === 0) {
      const maputoCity = await db.city.findFirst({ where: { name: 'Maputo' } });
      
      await db.deliveryFeeConfig.create({
        data: {
          cityId: maputoCity?.id,
          baseFee: 50,
          perKmFee: 20,
          minFee: 50,
          maxDistance: 20,
          platformCommissionPercent: 10,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Administrador criado com sucesso!',
      credentials: {
        email: adminUser.email,
        password: password || '123456'
      }
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar administrador',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Verificar status do admin
export async function GET() {
  try {
    const adminCount = await db.admin.count();
    const userCount = await db.user.count();
    const licenseCount = await db.license.count();
    const cityCount = await db.city.count();
    
    return NextResponse.json({
      adminExists: adminCount > 0,
      totalUsers: userCount,
      totalLicenses: licenseCount,
      totalCities: cityCount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 });
  }
}
