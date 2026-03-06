import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Create rating
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, giverId, receiverId, rating, comment, targetType } = body;

    if (!orderId || !giverId || !receiverId || !rating || !targetType) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Avaliação deve ser entre 1 e 5' },
        { status: 400 }
      );
    }

    // Check if already rated
    const existingRating = await db.rating.findUnique({
      where: {
        orderId_giverId_targetType: {
          orderId,
          giverId,
          targetType,
        },
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'Você já avaliou este pedido' },
        { status: 400 }
      );
    }

    // Create rating
    const newRating = await db.rating.create({
      data: {
        orderId,
        giverId,
        receiverId,
        rating,
        comment,
        targetType,
      },
    });

    // Update average rating for the receiver
    const allRatings = await db.rating.findMany({
      where: { receiverId, targetType },
    });
    
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    
    // Update in the appropriate model
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (receiver?.userType === 'DELIVERY_PERSON') {
      await db.deliveryPerson.update({
        where: { userId: receiverId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });
    } else if (receiver?.userType === 'PROVIDER') {
      // Provider rating could be stored differently
      // For now we just store it in the Rating table
    }

    return NextResponse.json({ rating: newRating });
  } catch (error) {
    console.error('Create rating error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar avaliação' },
      { status: 500 }
    );
  }
}

// Get ratings for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const receiverId = searchParams.get('receiverId');
    const targetType = searchParams.get('targetType');
    
    if (!receiverId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const where: { receiverId: string; targetType?: string } = { receiverId };
    if (targetType) where.targetType = targetType;

    const ratings = await db.rating.findMany({
      where,
      include: {
        giver: { select: { name: true } },
        order: { select: { createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate stats
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: ratings.filter(r => r.rating === star).length,
    }));

    return NextResponse.json({
      ratings,
      stats: {
        average: Math.round(avgRating * 10) / 10,
        total: ratings.length,
        counts: ratingCounts,
      },
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    );
  }
}
