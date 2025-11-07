// app/api/research/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import ResearchProject from '@/app/models/ResearchProject';
import Collaboration from '@/app/models/Collaboration';
import { z } from 'zod';
import mongoose from 'mongoose';

const updateProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255, "Le titre est trop long").optional(),
  description: z.string().max(1000, "La description est trop longue").optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'INSTITUTION']).optional(),
  tags: z.array(z.string()).optional(),
  discipline: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de projet invalide' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const collaboration = await Collaboration.findOne({
      project: id,
      $or: [
        { user: session.user.id, status: 'ACTIVE' },
        { userEmail: session.user.email, status: 'ACTIVE' }
      ]
    });

    const project = await ResearchProject.findOne({
      _id: id,
      $or: [
        { owner: session.user.id },
        { _id: collaboration?.project }
      ]
    })
    .populate('owner', 'name email affiliation');

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou accès non autorisé' },
        { status: 404 }
      );
    }

    const collaborations = await Collaboration.find({
      project: id,
      status: { $in: ['PENDING', 'ACTIVE'] }
    })
    .populate('user', 'name email affiliation')
    .populate('invitedBy', 'name email');

    const ProjectVersion = (await import('@/app/models/ProjectVersion')).default;
    const versions = await ProjectVersion.find({
      project: id
    })
    .populate('author', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

    const projectWithDetails = {
      ...project.toObject(),
      collaborators: collaborations,
      versions: versions
    };

    return NextResponse.json(projectWithDetails);

  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du projet' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de projet invalide' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const project = await ResearchProject.findOne({
      _id: id,
      owner: session.user.id
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou permissions insuffisantes' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const updatedProject = await ResearchProject.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('owner', 'name email affiliation');

    return NextResponse.json(updatedProject);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du projet' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de projet invalide' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const project = await ResearchProject.findOne({
      _id: id,
      owner: session.user.id
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou permissions insuffisantes' },
        { status: 404 }
      );
    }

    try {
      await Collaboration.deleteMany({ project: id });
      
      const ProjectVersion = (await import('@/app/models/ProjectVersion')).default;
      await ProjectVersion.deleteMany({ project: id });
      
      await ResearchProject.findByIdAndDelete(id);

    } catch (dbError: any) {
      console.error('Error during deletion operations:', dbError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des données associées' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Projet supprimé avec succès' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting project:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'ID de projet invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du projet' },
      { status: 500 }
    );
  }
}