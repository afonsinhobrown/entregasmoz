import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Get delivery persons with location (for map display)
export async function GET() {
  try {
    // Get ALL delivery persons with location data, not just available ones
    // This allows the map to show everyone, with their availability status
    const deliveryPersons = await db.deliveryPerson.findMany({
      where: {
        // Only show delivery persons who have location set (have logged in at least once)
        currentLatitude: { not: null },
        currentLongitude: { not: null },
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
