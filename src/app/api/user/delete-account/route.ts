import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Project from '@/app/models/ProjectVersion';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectToDatabase();

    const { password } = await request.json().catch(() => ({}));
    
    if (password) {
      const user = await User.findById(session.user.id).select('password');
      if (user) {
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 400 });
        }
      }
    }

    await Project.deleteMany({ owner: session.user.id });

    await User.findByIdAndDelete(session.user.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Compte supprimé avec succès' 
    });

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}