import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { emitEventToUser } from '../events/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, metadata, targetUserId } = body;

    // Utiliser l'utilisateur courant si targetUserId n'est pas spécifié
    const userId = targetUserId || session.user.id;

    const event = {
      type: 'action',
      actionType: type,
      title,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };

    const success = await emitEventToUser(userId, event);

    return NextResponse.json({ 
      success,
      message: success ? 'Événement émis avec succès' : 'Utilisateur non connecté au SSE'
    });

  } catch (error) {
    console.error('Erreur émission événement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'émission de l\'événement' },
      { status: 500 }
    );
  }
}