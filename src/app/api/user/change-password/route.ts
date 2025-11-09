import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      console.log('Missing fields:', { currentPassword: !!currentPassword, newPassword: !!newPassword });
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      console.log('Password too short:', newPassword.length);
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('password');

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Problème avec le compte utilisateur - mot de passe non défini' },
        { status: 500 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword, 
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'actuel' },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await User.findByIdAndUpdate(session.user.id, {
      password: hashedPassword,
      updatedAt: new Date(),
    });
    console.log('Update result:', result ? 'success' : 'failed');

    console.log('Password changed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Mot de passe modifié avec succès' 
    });

  } catch (error: any) {
    console.error('Detailed error changing password:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { error: `Erreur interne du serveur: ${error.message}` },
      { status: 500 }
    );
  }
}