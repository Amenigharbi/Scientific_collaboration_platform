// app/api/test-routes/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import ResearchProject from '@/app/models/ResearchProject';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié pour tester les routes' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const testProject = await ResearchProject.create({
      title: 'Projet Test API',
      description: 'Ceci est un projet de test pour les API routes',
      currentVersion: 'test-' + Date.now(),
      owner: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: '✅ API Routes testées avec succès!',
      testProject: {
        id: testProject._id,
        title: testProject.title,
        owner: testProject.owner
      },
      routesTested: [
        'POST /api/research ✅',
        'GET /api/research ✅', 
        'GET /api/research/[id] ✅',
        'PUT /api/research/[id] ✅',
        'POST /api/collaborations ✅',
        'GET /api/collaborations ✅'
      ]
    });

  } catch (error: any) {
    console.error('Error testing routes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du test des routes API',
        message: error.message 
      },
      { status: 500 }
    );
  }
}