import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
  if (!userId) return null;

  return await db.user.findUnique({
    where: { id: userId },
    select: { id: true, userType: true }
  });
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

// Função para enviar notificação push
async function sendPushNotification(subscription: any, payload: any) {
  const webpush = (await import('web-push')).default;

  webpush.setVapidDetails(
    'mailto:admin@entregasmoz.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId, title, body, type, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    // Verificar se o usuário tem permissão (admin ou o próprio usuário)
    if (user.userType !== 'ADMIN' && user.id !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Salvar notificação no banco
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        body,
        type: type || 'GENERAL',
        data: data || {},
        isSent: false
      }
    });

    // Buscar inscrições ativas do usuário
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    // Enviar notificações push
    const payload = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        notificationId: notification.id,
        type,
        ...data
      }
    };

    let sentCount = 0;
    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      const sent = await sendPushNotification(subscription, payload);
      if (sent) sentCount++;
    }

    // Atualizar status da notificação
    await db.notification.update({
      where: { id: notification.id },
      data: {
        isSent: sentCount > 0,
        sentAt: sentCount > 0 ? new Date() : undefined
      }
    });

    return NextResponse.json({
      success: true,
      notification,
      sentTo: sentCount,
      totalSubscriptions: subscriptions.length
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}