import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Collaboration from '@/app/models/Collaboration';
import ResearchProject from '@/app/models/ResearchProject';
import User from '@/app/models/User';
import { z } from 'zod';

const inviteCollaboratorSchema = z.object({
  projectId: z.string(),
  userEmail: z.string().email("Email invalide"),
  role: z.enum(['VIEWER', 'CONTRIBUTOR', 'MAINTAINER']).default('VIEWER'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Non authentifié ou email manquant' },
        { status: 401 }
      );
    }

    // S'assurer que name et email sont définis
    const userName = session.user.name || session.user.email;
    const userEmail = session.user.email;

    await connectToDatabase();
    
    const body = await request.json();
    const validatedData = inviteCollaboratorSchema.parse(body);

    // Vérifier que le projet existe et que l'utilisateur est le propriétaire
    const project = await ResearchProject.findOne({
      _id: validatedData.projectId,
      owner: session.user.id
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou permissions insuffisantes' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur existe
    const invitedUser = await User.findOne({ email: validatedData.userEmail });

    // Vérifier si une collaboration existe déjà
    const existingCollaboration = await Collaboration.findOne({
      project: validatedData.projectId,
      $or: [
        { user: invitedUser?._id },
        { userEmail: validatedData.userEmail }
      ]
    });

    if (existingCollaboration) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà invité à collaborer sur ce projet' },
        { status: 400 }
      );
    }

    // Créer l'invitation
    const collaboration = await Collaboration.create({
      project: validatedData.projectId,
      user: invitedUser?._id,
      userEmail: validatedData.userEmail,
      role: validatedData.role,
      status: 'PENDING',
      invitedBy: session.user.id,
    });

    // Peupler les données
    await collaboration.populate([
      { path: 'user', select: 'name email affiliation' },
      { path: 'invitedBy', select: 'name email' },
      { path: 'project', select: 'title' }
    ]);

    // SIMULATION D'ENVOI D'EMAIL (à remplacer par Resend plus tard)
    console.log('📧 SIMULATION EMAIL INVITATION:');
    console.log(`À: ${validatedData.userEmail}`);
    console.log(`Projet: ${project.title}`);
    console.log(`De: ${userName} (${userEmail})`);
    console.log(`Rôle: ${validatedData.role}`);

    return NextResponse.json(
      { 
        success: true,
        message: 'Invitation créée avec succès',
        collaboration,
        emailSimulated: true,
        note: 'L\'invitation a été enregistrée. Les emails réels seront envoyés quand Resend sera configuré.'
      },
      { status: 201 }
    );

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

    console.error('Error inviting collaborator:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'invitation' },
      { status: 500 }
    );
  }
}

// app/api/collaborations/route.ts - AJOUTER LA MÉTHODE GET
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received';

    let collaborations;

    if (type === 'received') {
      // Collaborations reçues par l'utilisateur
      collaborations = await Collaboration.find({
        $or: [
          { user: session.user.id },
          { userEmail: session.user.email }
        ]
      })
      .populate('project', 'title description')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });
    } else {
      // Collaborations envoyées par l'utilisateur
      collaborations = await Collaboration.find({
        invitedBy: session.user.id
      })
      .populate('project', 'title description')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      type,
      collaborations,
      count: collaborations.length
    });

  } catch (error: any) {
    console.error('Error fetching collaborations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des collaborations' },
      { status: 500 }
    );
  }
}