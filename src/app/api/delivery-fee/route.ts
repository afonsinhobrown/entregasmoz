import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Calculate delivery fee
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originLat, originLng, destLat, destLng, cityId } = body;

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json(
        { error: 'Coordenadas de origem e destino são obrigatórias' },
        { status: 400 }
      );
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLon = (destLng - originLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Get fee config (city-specific or global)
    let feeConfig = null;
    if (cityId) {
      feeConfig = await db.deliveryFeeConfig.findFirst({
        where: { cityId },
      });
    }
    if (!feeConfig) {
      feeConfig = await db.deliveryFeeConfig.findFirst({
        where: { cityId: null },
      });
    }

    // Default values if no config
    const baseFee = feeConfig?.baseFee || 50;
    const perKmFee = feeConfig?.perKmFee || 20;
    const minFee = feeConfig?.minFee || 50;
    const maxDistance = feeConfig?.maxDistance || 20;
    const platformCommissionPercent = feeConfig?.platformCommissionPercent || 10;

    // Check if within max distance
    if (distance > maxDistance) {
      return NextResponse.json({
        error: `Distância excede o máximo permitido (${maxDistance} km)`,
        distance,
        maxDistance,
      }, { status: 400 });
    }

    // Calculate fee
    const calculatedFee = baseFee + (distance * perKmFee);
    const deliveryFee = Math.max(minFee, Math.round(calculatedFee));
    const platformFee = Math.round(deliveryFee * (platformCommissionPercent / 100));
    const deliveryPersonAmount = deliveryFee - platformFee;

    return NextResponse.json({
      distance: Math.round(distance * 10) / 10, // 1 decimal
      deliveryFee,
      platformFee,
      deliveryPersonAmount,
      baseFee,
      perKmFee,
      estimatedTime: Math.round((distance / 30) * 60), // minutes (assuming 30 km/h avg)
    });
  } catch (error) {
    console.error('Calculate delivery fee error:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular taxa de entrega' },
      { status: 500 }
    );
  }
}

// Get fee config
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get('cityId');
    
    let feeConfig = null;
    if (cityId) {
      feeConfig = await db.deliveryFeeConfig.findFirst({
        where: { cityId },
        include: { city: true },
      });
    }
    if (!feeConfig) {
      feeConfig = await db.deliveryFeeConfig.findFirst({
        where: { cityId: null },
        include: { city: true },
      });
    }

    return NextResponse.json({ feeConfig });
  } catch (error) {
    console.error('Get fee config error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração de taxa' },
      { status: 500 }
    );
  }
}
