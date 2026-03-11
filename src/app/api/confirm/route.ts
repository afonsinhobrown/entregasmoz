import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { handleOrderDelivered } from '@/lib/order-notifications';

// Confirmar via QR Code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      qrCode, 
      confirmedBy, 
      type, 
      latitude, 
      longitude,
      amount,
      receiptImage,
      notes,
    } = body;
    
    if (!qrCode || !confirmedBy || !type) {
      return NextResponse.json({ 
        error: 'qrCode, confirmedBy e type são obrigatórios' 
      }, { status: 400 });
    }
    
    // Buscar pedido pelo QR Code
    const order = await db.order.findUnique({
      where: { qrCode },
      include: {
        deliveryPerson: true,
        provider: true,
        client: { include: { user: true } },
      },
    });
    
    if (!order) {
      return NextResponse.json({ error: 'QR Code inválido' }, { status: 404 });
    }
    
    // Verificar expiração do QR Code
    if (order.qrCodeExpiresAt && new Date() > order.qrCodeExpiresAt) {
      return NextResponse.json({ error: 'QR Code expirado' }, { status: 400 });
    }
    
    const confirmer = await db.user.findUnique({
      where: { id: confirmedBy },
    });
    
    if (!confirmer) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    let updateData: Record<string, unknown> = {};
    
    if (type === 'PICKUP') {
      // Confirmação de retirada pelo entregador
      if (confirmer.userType !== 'DELIVERY_PERSON') {
        return NextResponse.json({ 
          error: 'Apenas entregadores podem confirmar retirada' 
        }, { status: 403 });
      }
      
      if (order.deliveryPerson?.userId !== confirmedBy) {
        return NextResponse.json({ 
          error: 'Você não é o entregador deste pedido' 
        }, { status: 403 });
      }
      
      if (order.status !== 'READY') {
        return NextResponse.json({ 
          error: 'Pedido ainda não está pronto para retirada' 
        }, { status: 400 });
      }
      
      updateData = {
        status: 'PICKED_UP',
        pickupConfirmedAt: new Date(),
        pickupConfirmedBy: confirmedBy,
      };
    } 
    else if (type === 'DELIVERY') {
      // Confirmação de entrega pelo cliente
      if (confirmer.userType !== 'CLIENT') {
        return NextResponse.json({ 
          error: 'Apenas clientes podem confirmar entrega' 
        }, { status: 403 });
      }
      
      if (order.client.user.id !== confirmedBy) {
        return NextResponse.json({ 
          error: 'Você não é o cliente deste pedido' 
        }, { status: 403 });
      }
      
      if (order.status !== 'IN_TRANSIT') {
        return NextResponse.json({ 
          error: 'Pedido não está em trânsito' 
        }, { status: 400 });
      }
      
      updateData = {
        status: 'DELIVERED',
        deliveryConfirmedAt: new Date(),
        isPaidByClient: true,
        clientConfirmedAt: new Date(),
      };
    }
    else if (type === 'CASH_PAYMENT') {
      // Confirmação de pagamento cash pelo entregador
      if (confirmer.userType !== 'DELIVERY_PERSON') {
        return NextResponse.json({ 
          error: 'Apenas entregadores podem registrar pagamento cash' 
        }, { status: 403 });
      }
      
      updateData = {
        isCashPayment: true,
        cashCollectedAt: new Date(),
        cashTransferProof: receiptImage,
      };
    }
    else {
      return NextResponse.json({ error: 'Tipo de confirmação inválido' }, { status: 400 });
    }
    
    // Atualizar pedido
    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: updateData,
    });

    try {
      if (type === 'DELIVERY' && order.provider && order.client) {
        await handleOrderDelivered({
          order: updatedOrder,
          provider: order.provider,
          client: order.client,
        });
      }
    } catch (e) {
      console.error('Falha ao enviar notificação de entrega:', e);
    }
    
    // Criar registro de confirmação
    await db.orderConfirmation.create({
      data: {
        orderId: order.id,
        type,
        confirmedBy,
        latitude,
        longitude,
        amount,
        receiptImage,
        notes,
      },
    });
    
    // Criar registro de localização
    if (latitude && longitude) {
      await db.locationHistory.create({
        data: {
          userId: confirmedBy,
          deliveryPersonId: order.deliveryPersonId,
          latitude,
          longitude,
        },
      });
    }
    
    return NextResponse.json({ 
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Erro ao confirmar' }, { status: 500 });
  }
}
