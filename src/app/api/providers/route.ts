import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');
    const latitude = parseFloat(searchParams.get('latitude') || '-25.9653');
    const longitude = parseFloat(searchParams.get('longitude') || '32.5892');
    const category = searchParams.get('category');

    if (providerId) {
      // Get single provider
      const provider = await db.provider.findUnique({
        where: { id: providerId },
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
          products: {
            where: { isAvailable: true },
          },
        },
      });

      if (!provider) {
        return NextResponse.json(
          { error: 'Fornecedor não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({ provider });
    }

    // Get all providers with distance calculation
    const providers = await db.provider.findMany({
      where: {
        isOpen: true,
        ...(category && { category }),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        products: {
          where: { isAvailable: true },
          take: 3,
        },
      },
    });

    // Calculate distance and sort
    const providersWithDistance = providers.map((provider) => ({
      ...provider,
      distance:
        provider.latitude && provider.longitude
          ? calculateDistance(
              latitude,
              longitude,
              provider.latitude,
              provider.longitude
            )
          : null,
    }));

    providersWithDistance.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return NextResponse.json({ providers: providersWithDistance });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { providerId, isOpen, ...otherData } = body;

    const provider = await db.provider.update({
      where: { id: providerId },
      data: {
        ...(isOpen !== undefined && { isOpen }),
        ...otherData,
      },
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar fornecedor' },
      { status: 500 }
    );
  }
}
