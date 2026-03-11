// Exemplo: Como integrar notificações push no sistema de pedidos
// Este arquivo mostra como usar as notificações quando:
// - Novo pedido é criado
// - Pedido é atribuído a entregador
// - Pedido está pronto para retirada
// - Pedido é entregue

import { notifyAvailableDeliveryPersons, notifyDeliveryPerson, notifyProvider, NotificationTemplates } from '@/lib/notifications';

// Quando um novo pedido é criado
export async function handleNewOrder(orderData: any) {
  const { order, provider, client } = orderData;

  // 1. Notificar prestador que recebeu pedido
  await notifyProvider(
    provider.id,
    NotificationTemplates.ORDER_RECEIVED(order.id, client.name)
  );

  // 2. Notificar todos os entregadores disponíveis
  await notifyAvailableDeliveryPersons(
    NotificationTemplates.NEW_ORDER(order.id, provider.address)
  );

  console.log('✅ Notificações enviadas para novo pedido');
}

// Quando um pedido é atribuído a um entregador
export async function handleOrderAssigned(orderData: any) {
  const { order, deliveryPerson, provider } = orderData;

  // 1. Notificar entregador que pedido foi atribuído
  await notifyDeliveryPerson(
    deliveryPerson.id,
    NotificationTemplates.ORDER_ASSIGNED(order.id, order.deliveryAddress)
  );

  // 2. Notificar prestador que entregador está a caminho
  await notifyProvider(
    provider.id,
    NotificationTemplates.DELIVERY_PERSON_ARRIVED(order.id, deliveryPerson.user.name)
  );

  console.log('✅ Notificações enviadas para pedido atribuído');
}

// Quando pedido está pronto para retirada
export async function handleOrderReady(orderData: any) {
  const { order, deliveryPerson } = orderData;

  // Notificar entregador que pedido está pronto
  await notifyDeliveryPerson(
    deliveryPerson.id,
    NotificationTemplates.ORDER_PICKUP_READY(order.id, order.provider.storeName)
  );

  console.log('✅ Notificação enviada: pedido pronto para retirada');
}

// Quando pedido é entregue (confirmado pelo cliente)
export async function handleOrderDelivered(orderData: any) {
  const { order, provider, client } = orderData;

  // Notificar prestador que pedido foi entregue
  await notifyProvider(
    provider.id,
    {
      title: 'Pedido Entregue',
      body: `Pedido ${order.id} foi entregue com sucesso`,
      type: 'ORDER_DELIVERED',
      data: { orderId: order.id }
    }
  );

  // Se o entregador estiver associado, notificá-lo também
  if (order.deliveryPersonId || order.deliveryPerson?.id) {
    const deliveryPersonId = order.deliveryPersonId || order.deliveryPerson?.id;
    await notifyDeliveryPerson(
      deliveryPersonId,
      {
        title: 'Entrega Confirmada',
        body: `O cliente confirmou a entrega do pedido ${order.id}`,
        type: 'DELIVERY_CONFIRMED',
        data: { orderId: order.id }
      }
    );
  }

  console.log('✅ Notificação enviada: pedido entregue');
}