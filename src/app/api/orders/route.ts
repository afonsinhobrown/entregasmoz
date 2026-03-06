import { db } from '@/lib/db';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Gerar QR Code para pedido
function generateOrderQRCode(orderId: string): string {
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `ORD-${random}-${orderId.slice(-6).toUpperCase()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const clientId = searchParams.get('clientId');
    const providerId = searchParams.get('providerId');
    const deliveryPersonId = searchParams.get('deliveryPersonId');

    if (orderId) {
      // Get single order with full details
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          deliveryPerson: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
          confirmations: {
            include: {
              confirmer: { select: { name: true } },
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({ order });
    }

    // Get orders by role
    let orders;
    if (clientId) {
      orders = await db.order.findMany({
        where: { clientId },
        include: {
          provider: {
            select: {
              storeName: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          deliveryPerson: {
            include: {
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (providerId) {
      orders = await db.order.findMany({
        where: { providerId },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          deliveryPerson: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (deliveryPersonId) {
      orders = await db.order.findMany({
        where: {
          OR: [
            { deliveryPersonId },
            { deliveryPersonId: null, status: OrderStatus.READY },
          ],
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profileImage: true,
                },
              },
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      orders = await db.order.findMany({
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          provider: {
            select: {
              storeName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientId,
      providerId,
      deliveryPersonId,
      items,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      deliveryFee,
      platformFee,
      providerAmount,
      deliveryAmount,
      paymentMethod,
      notes,
    } = body;

    // Calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 404 }
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Generate QR Code
    const tempId = randomBytes(4).toString('hex');
    const qrCode = generateOrderQRCode(tempId);
    const qrCodeExpiresAt = new Date();
    qrCodeExpiresAt.setHours(qrCodeExpiresAt.getHours() + 24);

    const order = await db.order.create({
      data: {
        clientId,
        providerId,
        deliveryPersonId,
        totalAmount,
        deliveryFee: deliveryFee || 100,
        platformFee: platformFee || 0,
        providerAmount: providerAmount || totalAmount,
        deliveryAmount: deliveryAmount || 0,
        pickupAddress,
        pickupLatitude,
        pickupLongitude,
        deliveryAddress,
        deliveryLatitude,
        deliveryLongitude,
        paymentMethod: paymentMethod as PaymentMethod || PaymentMethod.MPESA,
        qrCode,
        qrCodeExpiresAt,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        provider: {
          select: { storeName: true, address: true },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, deliveryPersonId, isCashPayment, cashTransferProof } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (deliveryPersonId !== undefined) {
      updateData.deliveryPersonId = deliveryPersonId;
    }
    if (isCashPayment !== undefined) {
      updateData.isCashPayment = isCashPayment;
    }
    if (cashTransferProof) {
      updateData.cashTransferProof = cashTransferProof;
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        deliveryPerson: {
          include: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update delivery person stats if order is delivered
    if (status === OrderStatus.DELIVERED && order.deliveryPersonId) {
      await db.deliveryPerson.update({
        where: { id: order.deliveryPersonId },
        data: {
          totalDeliveries: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}
