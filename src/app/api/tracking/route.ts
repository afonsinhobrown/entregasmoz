import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obter tracking de um pedido
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const deliveryPersonId = searchParams.get('deliveryPersonId');
    
    if (orderId) {
      // Obter tracking do pedido
      const tracking = await db.orderTracking.findMany({
        where: { orderId },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
      
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          deliveryPerson: {
            include: {
              user: { select: { name: true, profileImage: true, phone: true } },
            },
          },
          provider: {
            select: { 
              storeName: true, 
              latitude: true, 
              longitude: true,
              address: true,
            },
          },
          client: {
            include: {
              user: { select: { name: true, phone: true } },
            },
          },
        },
      });
      
      return NextResponse.json({ tracking, order });
    }
    
    if (deliveryPersonId) {
      // Obter localização atual do entregador
      const deliveryPerson = await db.deliveryPerson.findUnique({
        where: { id: deliveryPersonId },
        include: {
          user: { select: { name: true, profileImage: true, phone: true } },
        },
      });
      
      if (!deliveryPerson) {
        return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 });
      }
      
      // Obter pedidos ativos do entregador
      const activeOrders = await db.order.findMany({
        where: {
          deliveryPersonId,
          status: { in: ['PICKED_UP', 'IN_TRANSIT'] },
        },
        include: {
          provider: { select: { storeName: true, latitude: true, longitude: true } },
          client: { 
            include: { 
              user: { select: { name: true } },
            },
          },
        },
      });
      
      return NextResponse.json({ 
        deliveryPerson,
        activeOrders,
      });
    }
    
    return NextResponse.json({ error: 'orderId ou deliveryPersonId é obrigatório' }, { status: 400 });
  } catch (error) {
    console.error('Tracking GET error:', error);
    return NextResponse.json({ error: 'Erro ao obter tracking' }, { status: 500 });
  }
}

// POST - Atualizar localização (tracking)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      orderId, 
      deliveryPersonId, 
      latitude, 
      longitude, 
      speed, 
      heading 
    } = body;
    
    if (!latitude || !longitude) {
      return NextResponse.json({ 
        error: 'latitude e longitude são obrigatórios' 
      }, { status: 400 });
    }
    
    // Atualizar localização do entregador
    if (deliveryPersonId) {
      await db.deliveryPerson.update({
        where: { id: deliveryPersonId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
        },
      });
      
      // Salvar no histórico
      await db.locationHistory.create({
        data: {
          userId: (await db.deliveryPerson.findUnique({ where: { id: deliveryPersonId } }))?.userId || '',
          deliveryPersonId,
          latitude,
          longitude,
        },
      });
    }
    
    // Se tem orderId, salvar tracking do pedido
    if (orderId) {
      await db.orderTracking.create({
        data: {
          orderId,
          latitude,
          longitude,
          speed,
          heading,
        },
      });
      
      // Atualizar status para IN_TRANSIT se estava PICKED_UP
      const order = await db.order.findUnique({
        where: { id: orderId },
      });
      
      if (order && order.status === 'PICKED_UP') {
        await db.order.update({
          where: { id: orderId },
          data: { status: 'IN_TRANSIT' },
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking POST error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tracking' }, { status: 500 });
  }
}
