import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// import { authOptions } from '@/lib/auth';
// import { getServerSession } from 'next-auth';

// Função simples para obter usuário da sessão (implementar conforme seu sistema de auth)
async function getCurrentUser(request: NextRequest) {
  // Por enquanto, vamos usar um header customizado para testes
  // Substitua pela sua lógica de autenticação real
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;

  return await db.user.findUnique({
    where: { id: userId },
    select: { id: true, userType: true }
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { endpoint, keys } = await request.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Salvar ou atualizar inscrição
    const subscription = await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: user.id,
          endpoint
        }
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || undefined,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || undefined
      }
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Erro ao salvar inscrição:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint necessário' }, { status: 400 });
    }

    // Desativar inscrição
    await db.pushSubscription.updateMany({
      where: {
        userId: user.id,
        endpoint
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover inscrição:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}