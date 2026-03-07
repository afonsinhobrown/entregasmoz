import { NextRequest, NextResponse } from 'next/server';

// Upload de imagem (base64)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, type, userId } = body;
    
    if (!image) {
      return NextResponse.json({ error: 'Imagem é obrigatória' }, { status: 400 });
    }
    
    // Validar se é base64
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 });
    }
    
    // Em produção, você salvaria em um serviço de storage
    // Por agora, retornamos o base64 como "url"
    const imageId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const imageUrl = `img_${imageId}`;
    
    // Se for foto de perfil, atualizar o usuário
    if (type === 'profile' && userId) {
      // Aqui você atualizaria o usuário com a nova foto
      // await db.user.update({ where: { id: userId }, data: { profileImage: image } });
    }
    
    return NextResponse.json({ 
      success: true,
      imageUrl: image, // Em produção, seria a URL do storage
      imageId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
