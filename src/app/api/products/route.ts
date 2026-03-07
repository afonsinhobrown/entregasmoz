import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const productId = searchParams.get('id');

    if (productId) {
      // Get single product
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          provider: {
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

      if (!product) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({ product });
    }

    if (providerId) {
      // Get products by provider
      const products = await db.product.findMany({
        where: {
          providerId,
          isAvailable: true,
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ products });
    }

    // Get all products
    const products = await db.product.findMany({
      where: { isAvailable: true },
      include: {
        provider: {
          select: {
            storeName: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, name, description, price, image } = body;

    const product = await db.product.create({
      data: {
        providerId,
        name,
        description,
        price: parseFloat(price),
        image,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { productId, isAvailable, ...otherData } = body;

    const product = await db.product.update({
      where: { id: productId },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...otherData,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }

    await db.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
}
