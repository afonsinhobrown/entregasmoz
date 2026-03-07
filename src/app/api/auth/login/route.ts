import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

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
        admin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Sua conta está bloqueada. Entre em contato com o suporte.' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.isActive && user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sua conta está inativa.' },
        { status: 403 }
      );
    }

    // Check password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Check license for providers and delivery persons
    let licenseWarning = null;
    if (user.userType === 'PROVIDER' && user.provider) {
      if (user.provider.licenseExpiresAt && new Date() > user.provider.licenseExpiresAt) {
        licenseWarning = 'Sua licença expirou. Renove para continuar usando a plataforma.';
      }
    }
    if (user.userType === 'DELIVERY_PERSON' && user.deliveryPerson) {
      if (user.deliveryPerson.licenseExpiresAt && new Date() > user.deliveryPerson.licenseExpiresAt) {
        licenseWarning = 'Sua licença expirou. Renove para continuar usando a plataforma.';
      }
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      user: userWithoutPassword,
      licenseWarning,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
