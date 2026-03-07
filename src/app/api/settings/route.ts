import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Get settings (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keys = searchParams.get('keys')?.split(',') || null;
    
    const where = keys ? { key: { in: keys } } : {};
    
    const settings = await db.setting.findMany({ where });
    
    // Return as key-value object
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }
    
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}
