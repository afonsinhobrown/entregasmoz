import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Get all cities
export async function GET() {
  try {
    const cities = await db.city.findMany({
      where: { isActive: true },
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Get cities error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cidades' },
      { status: 500 }
    );
  }
}
