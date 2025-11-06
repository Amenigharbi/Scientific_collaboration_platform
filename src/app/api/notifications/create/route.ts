import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Notification from '@/app/models/Notification';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { type, title, message, metadata, userId } = body;

    // Valider les données requises
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Le titre et le message sont requis' },
        { status: 400 }
      );
    }

    // Utiliser l'userId fourni ou celui de la session
    const targetUserId = userId || session.user.id;

    // Vérifier que l'userId est un ObjectId valide
    if (!Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Créer la notification en base de données
    const notification = await Notification.create({
      type: type || 'ACTION',
      title,
      message,
      metadata: metadata || {},
      userId: new Types.ObjectId(targetUserId),
      read: false
    });

    console.log('✅ Notification créée:', {
      id: notification._id.toString(),
      title: notification.title,
      userId: targetUserId
    });

    return NextResponse.json({ 
      success: true,
      notification: {
        _id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        metadata: notification.metadata,
        userId: notification.userId.toString(),
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur création notification:', error);
    
    // Donner plus de détails sur l'erreur
    let errorMessage = 'Erreur lors de la création de la notification';
    
    if (error.name === 'ValidationError') {
      errorMessage = `Erreur de validation: ${Object.values(error.errors).map((e: any) => e.message).join(', ')}`;
    } else if (error.code === 11000) {
      errorMessage = 'Erreur de duplication';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}