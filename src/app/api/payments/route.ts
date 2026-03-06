import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Get payments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const payments = await db.payment.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        provider: { select: { storeName: true } },
        deliveryPerson: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos' },
      { status: 500 }
    );
  }
}

// Create payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, 
      amount, 
      method, 
      providerId, 
      deliveryPersonId,
      licenseId,
      isPremium,
      receiptImage,
      receiptNumber,
    } = body;

    if (!userId || !amount || !method) {
      return NextResponse.json(
        { error: 'Usuário, valor e método são obrigatórios' },
        { status: 400 }
      );
    }

    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        method,
        providerId,
        deliveryPersonId,
        licenseId,
        isPremium: isPremium || false,
        receiptImage,
        receiptNumber,
        status: method === 'MANUAL' ? 'PENDING' : 'PROCESSING',
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}

// Update payment status (for admin confirmation)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, status, confirmedBy } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'ID do pagamento e status são obrigatórios' },
        { status: 400 }
      );
    }

    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        confirmedBy,
        confirmedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    // If payment is completed and is for a license, update the user's license
    if (status === 'COMPLETED' && payment.licenseId) {
      const license = await db.license.findUnique({
        where: { id: payment.licenseId },
      });

      if (license) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + license.durationDays);

        if (payment.providerId) {
          await db.provider.update({
            where: { id: payment.providerId },
            data: {
              licenseId: payment.licenseId,
              licenseExpiresAt: expiresAt,
            },
          });
        } else if (payment.deliveryPersonId) {
          await db.deliveryPerson.update({
            where: { id: payment.deliveryPersonId },
            data: {
              licenseId: payment.licenseId,
              licenseExpiresAt: expiresAt,
            },
          });
        }
      }
    }

    // Create transaction record
    if (status === 'COMPLETED') {
      await db.transaction.create({
        data: {
          userId: payment.userId,
          paymentId: payment.id,
          type: 'LICENSE_PAYMENT',
          amount: payment.amount,
          description: payment.isPremium 
            ? 'Pagamento de licença premium' 
            : 'Pagamento de licença',
        },
      });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento' },
      { status: 500 }
    );
  }
}
