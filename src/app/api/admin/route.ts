import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Get admin dashboard stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Dashboard statistics
      const [
        totalUsers,
        totalClients,
        totalDeliveryPersons,
        totalProviders,
        totalOrders,
        totalPayments,
        pendingPayments,
        totalRevenue,
        activeLicenses,
      ] = await Promise.all([
        db.user.count(),
        db.client.count(),
        db.deliveryPerson.count(),
        db.provider.count(),
        db.order.count(),
        db.payment.count(),
        db.payment.count({ where: { status: 'PENDING' } }),
        db.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        db.user.count({
          where: {
            OR: [
              { provider: { licenseExpiresAt: { gt: new Date() } } },
              { deliveryPerson: { licenseExpiresAt: { gt: new Date() } } },
            ],
          },
        }),
      ]);

      return NextResponse.json({
        stats: {
          totalUsers,
          totalClients,
          totalDeliveryPersons,
          totalProviders,
          totalOrders,
          totalPayments,
          pendingPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
          activeLicenses,
        },
      });
    }

    if (action === 'users') {
      // Get all users with details
      const users = await db.user.findMany({
        include: {
          client: true,
          deliveryPerson: true,
          provider: true,
          admin: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return NextResponse.json({ users });
    }

    if (action === 'usersWithoutLicense') {
      // Get providers and delivery persons without active license
      const users = await db.user.findMany({
        where: {
          isActive: true,
          isBlocked: false,
          OR: [
            { 
              provider: {
                OR: [
                  { licenseExpiresAt: null },
                  { licenseExpiresAt: { lt: new Date() } },
                ],
              },
            },
            {
              deliveryPerson: {
                OR: [
                  { licenseExpiresAt: null },
                  { licenseExpiresAt: { lt: new Date() } },
                ],
              },
            },
          ],
        },
        include: {
          provider: true,
          deliveryPerson: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ users });
    }

    if (action === 'settings') {
      // Get all settings
      const settings = await db.setting.findMany({
        orderBy: { key: 'asc' },
      });

      const deliveryConfigs = await db.deliveryFeeConfig.findMany({
        include: { city: true },
      });

      return NextResponse.json({ settings, deliveryConfigs });
    }

    return NextResponse.json({ error: 'Ação não especificada' }, { status: 400 });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// Update settings, block users, etc.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === 'blockUser') {
      const { userId, isBlocked } = data;
      const user = await db.user.update({
        where: { id: userId },
        data: { isBlocked },
      });
      return NextResponse.json({ user });
    }

    if (action === 'updateSetting') {
      const { key, value } = data;
      const setting = await db.setting.update({
        where: { key },
        data: { value },
      });
      return NextResponse.json({ setting });
    }

    if (action === 'updateDeliveryFee') {
      const { id, ...feeData } = data;
      const feeConfig = await db.deliveryFeeConfig.update({
        where: { id },
        data: feeData,
      });
      return NextResponse.json({ feeConfig });
    }

    if (action === 'createDeliveryFee') {
      const feeConfig = await db.deliveryFeeConfig.create({
        data,
      });
      return NextResponse.json({ feeConfig });
    }

    if (action === 'updateLicense') {
      const { id, ...licenseData } = data;
      const license = await db.license.update({
        where: { id },
        data: licenseData,
      });
      return NextResponse.json({ license });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// Create new settings, licenses, etc.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === 'createSetting') {
      const setting = await db.setting.create({
        data,
      });
      return NextResponse.json({ setting });
    }

    if (action === 'createLicense') {
      const license = await db.license.create({
        data,
      });
      return NextResponse.json({ license });
    }

    if (action === 'createCity') {
      const city = await db.city.create({
        data,
      });
      return NextResponse.json({ city });
    }

    if (action === 'createTrial') {
      const { userId, isFree, price } = data;
      
      // Find TRIAL license
      let trialLicense = await db.license.findFirst({
        where: { type: 'TRIAL' },
      });
      
      // Create TRIAL license if not exists
      if (!trialLicense) {
        trialLicense = await db.license.create({
          data: {
            name: 'Trial',
            type: 'TRIAL',
            priceProvider: price || 0,
            priceDelivery: price || 0,
            durationDays: 10,
            isTrial: true,
            isFree: isFree,
            isActive: true,
            targetUserType: 'BOTH',
            transactionFeePercent: 5,
          },
        });
      }
      
      // Calculate expiration date (10 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 10);
      
      // Get user to determine type
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { provider: true, deliveryPerson: true },
      });
      
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      // Update user's license
      if (user.provider) {
        await db.provider.update({
          where: { id: user.provider.id },
          data: {
            licenseId: trialLicense.id,
            licenseExpiresAt: expiresAt,
          },
        });
      } else if (user.deliveryPerson) {
        await db.deliveryPerson.update({
          where: { id: user.deliveryPerson.id },
          data: {
            licenseId: trialLicense.id,
            licenseExpiresAt: expiresAt,
          },
        });
      }
      
      // Create payment record if not free
      if (!isFree && price && price > 0) {
        await db.payment.create({
          data: {
            userId,
            amount: price,
            method: 'MANUAL',
            status: 'COMPLETED',
            licenseId: trialLicense.id,
            providerId: user.provider?.id,
            deliveryPersonId: user.deliveryPerson?.id,
          },
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        license: trialLicense,
        expiresAt,
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
