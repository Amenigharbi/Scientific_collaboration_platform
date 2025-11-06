import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Collaboration from '@/app/models/Collaboration';
import { z } from 'zod';

const updateCollaborationSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'INACTIVE']),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await request.json();
    const validatedData = updateCollaborationSchema.parse(body);

    const collaboration = await Collaboration.findOne({
      _id: id,
      $or: [
        { user: session.user.id },
        { userEmail: session.user.email }
      ]
    });

    if (!collaboration) {
      return NextResponse.json(
        { error: 'Collaboration non trouvée ou accès non autorisé' },
        { status: 404 }
      );
    }

    const updatedCollaboration = await Collaboration.findByIdAndUpdate(
      id,
      { $set: { status: validatedData.status } },
      { new: true }
    )
    .populate('project', 'title')
    .populate('invitedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: `Collaboration ${validatedData.status === 'ACTIVE' ? 'acceptée' : 'refusée'}`,
      collaboration: updatedCollaboration
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating collaboration:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la collaboration' },
      { status: 500 }
    );
  }
}