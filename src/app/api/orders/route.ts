import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const clientId = searchParams.get('clientId');
    const providerId = searchParams.get('providerId');
    const deliveryPersonId = searchParams.get('deliveryPersonId');

    if (orderId) {
      // Get single order
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
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
            },
          },
          deliveryPerson: {
            include: {
              user: {
                select: {
                  name: true,
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
      items,
      deliveryAddress,
      pickupAddress,
      deliveryFee,
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

    const order = await db.order.create({
      data: {
        clientId,
        providerId,
        totalAmount,
        deliveryFee: deliveryFee || 100,
        pickupAddress,
        deliveryAddress,
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
    const { orderId, status, deliveryPersonId } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (deliveryPersonId !== undefined) {
      updateData.deliveryPersonId = deliveryPersonId;
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
              },
            },
          },
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        deliveryPerson: {
          include: {
            user: {
              select: {
                name: true,
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
