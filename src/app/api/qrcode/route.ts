import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Gerar QR Code para pedido
function generateOrderQRCode(orderId: string): string {
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `ORD-${random}-${orderId.slice(-6).toUpperCase()}`;
}

// GET - Obter QR Code de um pedido
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const qrCode = searchParams.get('qrCode');
    
    if (qrCode) {
      // Buscar pedido pelo QR Code
      const order = await db.order.findUnique({
        where: { qrCode },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          client: {
            include: {
              user: { select: { name: true, phone: true, profileImage: true } },
            },
          },
          provider: {
            include: {
              user: { select: { name: true, phone: true } },
            },
          },
          deliveryPerson: {
            include: {
              user: { select: { name: true, phone: true, profileImage: true } },
            },
          },
        },
      });
      
      if (!order) {
        return NextResponse.json({ error: 'QR Code inválido' }, { status: 404 });
      }
      
      return NextResponse.json({ order });
    }
    
    if (orderId) {
      // Buscar pedido pelo ID
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      
      if (!order) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }
      
      // Se não tem QR Code, gerar um
      if (!order.qrCode) {
        const newQRCode = generateOrderQRCode(order.id);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24h
        
        await db.order.update({
          where: { id: orderId },
          data: {
            qrCode: newQRCode,
            qrCodeExpiresAt: expiresAt,
          },
        });
        
        return NextResponse.json({ 
          qrCode: newQRCode,
          expiresAt,
          order: { ...order, qrCode: newQRCode },
        });
      }
      
      return NextResponse.json({ 
        qrCode: order.qrCode,
        expiresAt: order.qrCodeExpiresAt,
        order,
      });
    }
    
    return NextResponse.json({ error: 'orderId ou qrCode é obrigatório' }, { status: 400 });
  } catch (error) {
    console.error('QR Code error:', error);
    return NextResponse.json({ error: 'Erro ao processar QR Code' }, { status: 500 });
  }
}

// POST - Gerar/regenerar QR Code para pedido
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }
    
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    // Gerar novo QR Code
    const newQRCode = generateOrderQRCode(orderId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await db.order.update({
      where: { id: orderId },
      data: {
        qrCode: newQRCode,
        qrCodeExpiresAt: expiresAt,
      },
    });
    
    return NextResponse.json({ 
      qrCode: newQRCode,
      expiresAt,
    });
  } catch (error) {
    console.error('Generate QR Code error:', error);
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 });
  }
}
