import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('preferences');
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const defaultPreferences = {
      emailNotifications: true,
      projectNotifications: true,
      collaborationNotifications: true,
      darkMode: false,
      publicProfile: true,
      activityVisible: true,
      defaultProjectVisibility: 'INSTITUTION' as const,
      language: 'fr',
      timezone: 'Europe/Paris'
    };

    const userPreferences = user.preferences ? user.preferences.toObject() : defaultPreferences;
    
    return NextResponse.json(userPreferences);

  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    
    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { 
          preferences: body,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('preferences');

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const updatedPreferences = user.preferences ? user.preferences.toObject() : body;
    
    return NextResponse.json(updatedPreferences);

  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: `Erreur interne du serveur: ${error.message}` },
      { status: 500 }
    );
  }
}