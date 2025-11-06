import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import ResearchProject from '@/app/models/ResearchProject';
import Collaboration from '@/app/models/Collaboration';
import User from '@/app/models/User'; // ✅ IMPORT AJOUTÉ
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255, "Le titre est trop long"),
  description: z.string().max(1000, "La description est trop longue").optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'INSTITUTION']).default('PRIVATE'),
  tags: z.array(z.string()).optional(),
  discipline: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const generateVersionHash = () => {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    };

    const project = await ResearchProject.create({
      ...validatedData,
      currentVersion: generateVersionHash(),
      owner: session.user.id,
    });

    // Créer la version initiale
    const ProjectVersion = (await import('@/app/models/ProjectVersion')).default;
    await ProjectVersion.create({
      version: project.currentVersion,
      message: 'Initial commit - Project creation',
      changes: {
        type: 'CREATE_PROJECT',
        title: project.title,
        description: project.description,
      },
      project: project._id,
      author: session.user.id,
    });

    // Peupler les données de l'owner
    await project.populate('owner', 'name email affiliation');

    return NextResponse.json(
      { 
        message: 'Projet créé avec succès',
        project 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.issues
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Un projet avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du projet' },
      { status: 500 }
    );
  }
}

// Route GET - Version corrigée
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Trouver les collaborations actives de l'utilisateur
    const userCollaborations = await Collaboration.find({
      $or: [
        { user: session.user.id, status: 'ACTIVE' },
        { userEmail: session.user.email, status: 'ACTIVE' }
      ]
    }).select('project');

    const collaborationProjectIds = userCollaborations.map(c => c.project);

    // Requête avec populate corrigé
    const projects = await ResearchProject.find({
      $or: [
        { owner: session.user.id },
        { _id: { $in: collaborationProjectIds } }
      ]
    })
    .populate({
      path: 'owner',
      model: User, // ✅ SPÉCIFIER EXPLICITEMENT LE MODÈLE
      select: 'name email affiliation'
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Utiliser lean() pour de meilleures performances

    // Compter le total
    const total = await ResearchProject.countDocuments({
      $or: [
        { owner: session.user.id },
        { _id: { $in: collaborationProjectIds } }
      ]
    });

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    );
  }
}