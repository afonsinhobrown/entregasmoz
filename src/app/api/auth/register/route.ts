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

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, userType, profileImage, ...additionalData } = body;

    const normalizedName = normalizeOptionalString(name);
    const normalizedEmail = normalizeOptionalString(email)?.toLowerCase();
    const normalizedPassword = normalizeOptionalString(password);
    const normalizedPhone = normalizeOptionalString(phone);
    const normalizedProfileImage = normalizeOptionalString(profileImage);
    const normalizedCityId = normalizeOptionalString(additionalData.cityId);
    const requiresCity = userType === 'CLIENT' || userType === 'DELIVERY_PERSON' || userType === 'PROVIDER';

    if (!normalizedName || !normalizedEmail || !normalizedPassword || !userType) {
      return NextResponse.json(
        { error: 'Nome, email, senha e tipo de usuário são obrigatórios' },
        { status: 400 }
      );
    }

    if (requiresCity && !normalizedCityId) {
      return NextResponse.json(
        { error: 'Cidade é obrigatória para concluir o cadastro' },
        { status: 400 }
      );
    }

    if (normalizedCityId) {
      const city = await db.city.findUnique({ where: { id: normalizedCityId } });
      if (!city || !city.isActive) {
        return NextResponse.json(
          { error: 'Cidade inválida ou inativa' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Validações específicas por tipo
    if (userType === 'DELIVERY_PERSON') {
      const plateNumber = normalizeOptionalString(additionalData.plateNumber);
      if (!plateNumber) {
        return NextResponse.json(
          { error: 'Matrícula do veículo é obrigatória para entregadores' },
          { status: 400 }
        );
      }
      additionalData.plateNumber = plateNumber.toUpperCase();
    }

    if (userType === 'PROVIDER') {
      if (!normalizeOptionalString(additionalData.storeName)) {
        return NextResponse.json(
          { error: 'Nome da loja é obrigatório para prestadores' },
          { status: 400 }
        );
      }
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    // Create user with transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          phone: normalizedPhone,
          profileImage: normalizedProfileImage,
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
            cityId: normalizedCityId,
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
            vehicleColor: normalizeOptionalString(additionalData.vehicleColor),
            vehicleBrand: normalizeOptionalString(additionalData.vehicleBrand),
            qrCode,
            currentLatitude: -25.9653,
            currentLongitude: 32.5892,
            cityId: normalizedCityId,
          },
        });
      } else if (userType === 'PROVIDER') {
        await tx.provider.create({
          data: {
            userId: newUser.id,
            storeName: normalizeOptionalString(additionalData.storeName) || 'Loja sem nome',
            storeDescription: normalizeOptionalString(additionalData.storeDescription),
            storeImage: normalizeOptionalString(additionalData.storeImage),
            category: normalizeOptionalString(additionalData.category),
            address: normalizeOptionalString(additionalData.storeAddress),
            latitude: additionalData.latitude || -25.9653,
            longitude: additionalData.longitude || 32.5892,
            cityId: normalizedCityId,
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
