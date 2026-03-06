import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Get available delivery persons
export async function GET() {
  try {
    const deliveryPersons = await db.deliveryPerson.findMany({
      where: {
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ deliveryPersons });
  } catch (error) {
    console.error('Get delivery persons error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar entregadores' },
      { status: 500 }
    );
  }
}
