import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Gerar QR Code único para entregador
function generateDeliveryQRCode(): string {
  const random = randomBytes(8).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `DEL-${random}-${timestamp}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, userType, profileImage, ...additionalData } = body;

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

    // Validações específicas por tipo
    if (userType === 'DELIVERY_PERSON') {
      if (!additionalData.plateNumber || additionalData.plateNumber.trim() === '') {
        return NextResponse.json(
          { error: 'Matrícula do veículo é obrigatória para entregadores' },
          { status: 400 }
        );
      }
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          profileImage,
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
            cityId: additionalData.cityId,
          },
        });
      } else if (userType === 'DELIVERY_PERSON') {
        // Gerar QR Code único para o entregador
        const qrCode = generateDeliveryQRCode();
        
        await tx.deliveryPerson.create({
          data: {
            userId: newUser.id,
            vehicleType: additionalData.vehicleType || 'MOTORCYCLE',
            plateNumber: additionalData.plateNumber, // Obrigatório
            vehicleColor: additionalData.vehicleColor,
            vehicleBrand: additionalData.vehicleBrand,
            qrCode,
            currentLatitude: -25.9653,
            currentLongitude: 32.5892,
            cityId: additionalData.cityId,
          },
        });
      } else if (userType === 'PROVIDER') {
        await tx.provider.create({
          data: {
            userId: newUser.id,
            storeName: additionalData.storeName,
            storeDescription: additionalData.storeDescription,
            storeImage: additionalData.storeImage,
            category: additionalData.category,
            address: additionalData.storeAddress,
            latitude: additionalData.latitude || -25.9653,
            longitude: additionalData.longitude || 32.5892,
            cityId: additionalData.cityId,
          },
        });
      }

      return newUser;
    });

    // Fetch user with relations
    const userWithRelations = await db.user.findUnique({
      where: { id: user.id },
      include: {
        client: true,
        deliveryPerson: true,
        provider: true,
        admin: true,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = userWithRelations;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar usuário' },
      { status: 500 }
    );
  }
}
