import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { handleOrderAssigned } from '@/lib/order-notifications';

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get available deliveries for delivery person
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryPersonId = searchParams.get('deliveryPersonId');
    const latitude = parseFloat(searchParams.get('latitude') || '-25.9653');
    const longitude = parseFloat(searchParams.get('longitude') || '32.5892');

    // Get orders that need delivery (READY status and no delivery person assigned)
    const availableOrders = await db.order.findMany({
      where: {
        status: OrderStatus.READY,
        deliveryPersonId: null,
      },
      include: {
        provider: {
          select: {
            id: true,
            storeName: true,
            address: true,
            latitude: true,
            longitude: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate distance to each pickup location
    const ordersWithDistance = availableOrders.map((order) => ({
      ...order,
      pickupDistance:
        order.provider.latitude && order.provider.longitude
          ? calculateDistance(
              latitude,
              longitude,
              order.provider.latitude,
              order.provider.longitude
            )
          : null,
    }));

    // Sort by distance
    ordersWithDistance.sort((a, b) => {
      if (a.pickupDistance === null) return 1;
      if (b.pickupDistance === null) return -1;
      return a.pickupDistance - b.pickupDistance;
    });

    // Get delivery person's active deliveries
    let activeDeliveries: any[] = [];
    if (deliveryPersonId) {
      activeDeliveries = await db.order.findMany({
        where: {
          deliveryPersonId,
          status: {
            in: [
              OrderStatus.READY,
              OrderStatus.PICKED_UP,
            ],
          },
        },
        include: {
          provider: {
            select: {
              storeName: true,
              address: true,
              latitude: true,
              longitude: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
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
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      availableDeliveries: ordersWithDistance,
      activeDeliveries,
    });
  } catch (error) {
    console.error('Get deliveries error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar entregas' },
      { status: 500 }
    );
  }
}

// Accept delivery
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, deliveryPersonId } = body;

    // Check if order is still available
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    if (order.deliveryPersonId) {
      return NextResponse.json(
        { error: 'Este pedido já foi aceito por outro entregador' },
        { status: 400 }
      );
    }

    if (order.status !== OrderStatus.READY) {
      return NextResponse.json(
        { error: 'Este pedido não está pronto para entrega' },
        { status: 400 }
      );
    }

    // Assign delivery person to order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        deliveryPersonId,
      },
      include: {
        provider: {
          select: {
            id: true,
            storeName: true,
            address: true,
            latitude: true,
            longitude: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
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
        items: {
          include: {
            product: true,
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
      },
    });

    try {
      if (updatedOrder.provider && updatedOrder.deliveryPerson) {
        await handleOrderAssigned({
          order: updatedOrder,
          deliveryPerson: updatedOrder.deliveryPerson,
          provider: updatedOrder.provider,
        });
      }
    } catch (e) {
      console.error('Falha ao enviar notificação de atribuição:', e);
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Accept delivery error:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar entrega' },
      { status: 500 }
    );
  }
}

// Update delivery person availability and location
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { deliveryPersonId, isAvailable, latitude, longitude } = body;

    const deliveryPerson = await db.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(latitude !== undefined && { currentLatitude: latitude }),
        ...(longitude !== undefined && { currentLongitude: longitude }),
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ deliveryPerson });
  } catch (error) {
    console.error('Update delivery person error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar entregador' },
      { status: 500 }
    );
  }
}
