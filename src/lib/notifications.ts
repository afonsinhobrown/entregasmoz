import { db } from '@/lib/db';

export interface NotificationData {
  title: string;
  body: string;
  type: string;
  data?: any;
}

// Função para enviar notificação push via web-push
async function sendWebPush(subscription: any, payload: any) {
  const webpush = (await import('web-push')).default;
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys não configuradas. Notificação push não enviada.');
    return false;
  }

  webpush.setVapidDetails(
    'mailto:admin@entregasmoz.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação via web-push:', error);
    return false;
  }
}

/**
 * Envia notificação push para um usuário específico
 */
export async function sendPushNotificationToUser(
  userId: string,
  notificationData: NotificationData
) {
  try {
    const { title, body, type, data } = notificationData;
    
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

    if (subscriptions.length === 0) {
      return { success: true, sentTo: 0, error: 'Usuário sem inscrições ativas' };
    }

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

      const sent = await sendWebPush(subscription, payload);
      if (sent) sentCount++;
    }

    // Atualizar status da notificação
    if (sentCount > 0) {
      await db.notification.update({
        where: { id: notification.id },
        data: {
          isSent: true,
          sentAt: new Date()
        }
      });
    }

    return {
      success: true,
      notification,
      sentTo: sentCount,
      totalSubscriptions: subscriptions.length
    };
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação para todos os entregadores disponíveis
 */
export async function notifyAvailableDeliveryPersons(notification: NotificationData) {
  try {
    const deliveryPersons = await db.deliveryPerson.findMany({
      where: {
        isAvailable: true,
        user: {
          isActive: true,
          isBlocked: false
        }
      },
      select: {
        userId: true
      }
    });

    const results: any[] = [];
    for (const dp of deliveryPersons) {
      const result = await sendPushNotificationToUser(dp.userId, notification);
      results.push(result);
    }

    return {
      success: true,
      totalSent: results.filter(r => r.success).length,
      totalRecipients: deliveryPersons.length,
      results
    };
  } catch (error) {
    console.error('Erro ao notificar entregadores:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação para um entregador específico
 */
export async function notifyDeliveryPerson(
  deliveryPersonId: string,
  notification: NotificationData
) {
  try {
    const deliveryPerson = await db.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      select: { userId: true }
    });

    if (!deliveryPerson) {
      return { success: false, error: 'Entregador não encontrado' };
    }

    return await sendPushNotificationToUser(deliveryPerson.userId, notification);
  } catch (error) {
    console.error('Erro ao notificar entregador:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação para um prestador específico
 */
export async function notifyProvider(
  providerId: string,
  notification: NotificationData
) {
  try {
    const provider = await db.provider.findUnique({
      where: { id: providerId },
      select: { userId: true }
    });

    if (!provider) {
      return { success: false, error: 'Prestador não encontrado' };
    }

    return await sendPushNotificationToUser(provider.userId, notification);
  } catch (error) {
    console.error('Erro ao notificar prestador:', error);
    return { success: false, error };
  }
}

/**
 * Notificações predefinidas para cenários comuns
 */
export const NotificationTemplates = {
  // Para entregadores
  NEW_ORDER: (orderId: string, pickupAddress: string) => ({
    title: 'Novo Pedido Disponível!',
    body: `Pedido para retirada em: ${pickupAddress}`,
    type: 'ORDER_NEW',
    data: { orderId, url: `/orders/${orderId}` }
  }),

  ORDER_ASSIGNED: (orderId: string, deliveryAddress: string) => ({
    title: 'Pedido Atribuído',
    body: `Entrega para: ${deliveryAddress}`,
    type: 'ORDER_ASSIGNED',
    data: { orderId, url: `/orders/${orderId}` }
  }),

  ORDER_PICKUP_READY: (orderId: string, storeName: string) => ({
    title: 'Pedido Pronto para Retirada',
    body: `${storeName} está aguardando sua chegada`,
    type: 'ORDER_PICKUP_READY',
    data: { orderId, url: `/orders/${orderId}` }
  }),

  // Para prestadores
  ORDER_RECEIVED: (orderId: string, customerName: string) => ({
    title: 'Novo Pedido Recebido',
    body: `Pedido de ${customerName} - preparar para entrega`,
    type: 'ORDER_RECEIVED',
    data: { orderId, url: `/orders/${orderId}` }
  }),

  DELIVERY_PERSON_ARRIVED: (orderId: string, deliveryPersonName: string) => ({
    title: 'Entregador Chegou',
    body: `${deliveryPersonName} está aguardando o pedido`,
    type: 'DELIVERY_ARRIVED',
    data: { orderId, url: `/orders/${orderId}` }
  })
};