import { db } from '@/lib/db';
import { hash } from 'crypto';
import { NextResponse } from 'next/server';

function hashPassword(password: string): string {
  return hash('sha256', password);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        client: true,
        deliveryPerson: true,
        provider: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    // Check password
    if (user.password !== hashPassword(password)) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
