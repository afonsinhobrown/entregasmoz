import { db } from '@/lib/db';
import { hash } from 'crypto';
import { NextResponse } from 'next/server';

function hashPassword(password: string): string {
  return hash('sha256', password);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, userType, ...additionalData } = body;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Create user with transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashPassword(password),
          phone,
          userType,
        },
      });

      // Create role-specific profile
      if (userType === 'CLIENT') {
        await tx.client.create({
          data: {
            userId: newUser.id,
            address: additionalData.address,
            latitude: additionalData.latitude || -25.9653,
            longitude: additionalData.longitude || 32.5892,
          },
        });
      } else if (userType === 'DELIVERY_PERSON') {
        await tx.deliveryPerson.create({
          data: {
            userId: newUser.id,
            vehicleType: additionalData.vehicleType || 'MOTORCYCLE',
            plateNumber: additionalData.plateNumber,
            currentLatitude: -25.9653,
            currentLongitude: 32.5892,
          },
        });
      } else if (userType === 'PROVIDER') {
        await tx.provider.create({
          data: {
            userId: newUser.id,
            storeName: additionalData.storeName,
            storeDescription: additionalData.storeDescription,
            category: additionalData.category,
            address: additionalData.storeAddress,
            latitude: additionalData.latitude || -25.9653,
            longitude: additionalData.longitude || 32.5892,
          },
        });
      }

      return newUser;
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar usuário' },
      { status: 500 }
    );
  }
}
