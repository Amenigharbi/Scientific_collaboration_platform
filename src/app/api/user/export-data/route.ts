import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Project from '@/app/models/ProjectVersion';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    const projects = await Project.find({ owner: session.user.id });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        institution: user.institution,
        specialization: user.specialization,
        bio: user.bio,
        website: user.website,
        location: user.location,
        orcid: user.orcid,
        joinedAt: user.createdAt,
        lastActive: user.updatedAt
      },
      preferences: user.preferences || {},
      projects: projects.map(project => ({
        title: project.title,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      })),
      exportDate: new Date().toISOString()
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${session.user.id}.json"`,
      },
    });

  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données' },
      { status: 500 }
    );
  }
}