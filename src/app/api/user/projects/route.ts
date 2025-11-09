import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import ResearchProject from '@/app/models/ResearchProject';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectToDatabase();

    const projects = await ResearchProject.find({
      owner: session.user.id 
    })
    .select('title description status visibility createdAt updatedAt tags discipline currentVersion')
    .sort({ updatedAt: -1 })
    .exec();


    const formattedProjects = projects.map(project => {
      const projectObj = project.toObject();
      
      return {
        _id: projectObj._id.toString(),
        title: projectObj.title,
        description: projectObj.description || '',
        status: projectObj.status,
        visibility: projectObj.visibility,
        tags: projectObj.tags || [],
        discipline: projectObj.discipline || '',
        currentVersion: projectObj.currentVersion,
        createdAt: projectObj.createdAt.toISOString(),
        updatedAt: projectObj.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ 
      projects: formattedProjects 
    });

  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}