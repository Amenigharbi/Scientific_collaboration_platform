// /api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'L\'image ne doit pas dépasser 5MB' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Chemin de sauvegarde
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    const filePath = path.join(uploadsDir, fileName);

    // Créer le dossier s'il n'existe pas
    await mkdir(uploadsDir, { recursive: true });

    // Sauvegarder le fichier
    await writeFile(filePath, buffer);

    // URL accessible publiquement
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { avatar: avatarUrl, updatedAt: new Date() },
      { new: true }
    ).select('avatar');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: updatedUser.avatar 
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de l\'avatar' },
      { status: 500 }
    );
  }
}