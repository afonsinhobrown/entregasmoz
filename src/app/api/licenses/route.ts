import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Get all licenses
export async function GET() {
  try {
    const licenses = await db.license.findMany({
      where: { isActive: true },
      orderBy: { priceProvider: 'asc' },
    });
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Get licenses error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar licenças' },
      { status: 500 }
    );
  }
}
