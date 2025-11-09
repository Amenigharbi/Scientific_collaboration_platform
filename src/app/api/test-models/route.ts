// app/api/test-models/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { 
  User, 
  ResearchProject, 
  ProjectVersion, 
  Dataset, 
  DatasetVersion, 
  Collaboration 
} from '@/app/models';

export async function GET() {
  try {
    await connectToDatabase();
    
    const userCount = await User.countDocuments();
    const projectCount = await ResearchProject.countDocuments();
    const versionCount = await ProjectVersion.countDocuments();
    const datasetCount = await Dataset.countDocuments();
    const datasetVersionCount = await DatasetVersion.countDocuments();
    const collaborationCount = await Collaboration.countDocuments();

    return NextResponse.json({
      success: true,
      message: '✅ Tous les modèles MongoDB sont opérationnels!',
      collections: {
        users: userCount,
        researchProjects: projectCount,
        projectVersions: versionCount,
        datasets: datasetCount,
        datasetVersions: datasetVersionCount,
        collaborations: collaborationCount
      },
      models: [
        'User ✅',
        'ResearchProject ✅', 
        'ProjectVersion ✅',
        'Dataset ✅',
        'DatasetVersion ✅',
        'Collaboration ✅'
      ]
    });

  } catch (error: any) {
    console.error('Error testing models:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur avec les modèles MongoDB',
        message: error.message 
      },
      { status: 500 }
    );
  }
}