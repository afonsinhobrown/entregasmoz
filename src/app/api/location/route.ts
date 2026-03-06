import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Update location for any user type
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, latitude, longitude, isAvailable, userType } = body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'userId, latitude e longitude são obrigatórios' },
        { status: 400 }
      );
    }

    if (userType === 'DELIVERY_PERSON') {
      const deliveryPerson = await db.deliveryPerson.update({
        where: { userId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          ...(isAvailable !== undefined && { isAvailable }),
        },
      });
      return NextResponse.json({ success: true, deliveryPerson });
    } 
    
    if (userType === 'PROVIDER') {
      const existingProvider = await db.provider.findFirst({
        where: { userId },
      });

      if (existingProvider && !existingProvider.latitude) {
        await db.provider.update({
          where: { userId },
          data: { latitude, longitude },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (userType === 'CLIENT') {
      const client = await db.client.update({
        where: { userId },
        data: { latitude, longitude },
      });
      return NextResponse.json({ success: true, client });
    }

    return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar localização' },
      { status: 500 }
    );
  }
}
