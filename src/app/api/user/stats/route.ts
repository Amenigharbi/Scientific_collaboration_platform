import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import ResearchProject from '@/app/models/ResearchProject';
import Collaboration from '@/app/models/Collaboration';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectToDatabase();

    const totalProjects = await ResearchProject.countDocuments({ 
      owner: session.user.id 
    });
    
    const activeProjects = await ResearchProject.countDocuments({
      owner: session.user.id,
      status: 'ACTIVE'
    });
    
    const totalCollaborations = await Collaboration.countDocuments({
      $or: [
        { user: session.user.id, status: 'ACTIVE' },
        { userEmail: session.user.email, status: 'ACTIVE' }
      ]
    });
    
    const pendingInvitations = await Collaboration.countDocuments({
      $or: [
        { user: session.user.id, status: 'PENDING' },
        { userEmail: session.user.email, status: 'PENDING' }
      ]
    });

    const stats = {
      totalProjects,
      activeProjects,
      totalCollaborations,
      pendingInvitations
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}