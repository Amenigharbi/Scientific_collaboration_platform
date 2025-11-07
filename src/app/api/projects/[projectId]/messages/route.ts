// app/api/projects/[projectId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchMessagesFromDB, createMessageInDB } from '@/app/lib/message-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> } // params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID de projet manquant' },
        { status: 400 }
      );
    }

    const messages = await fetchMessagesFromDB(projectId);

    return NextResponse.json({
      messages: messages || [],
      success: true
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> } // params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // ✅ Await les params
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID de projet manquant' },
        { status: 400 }
      );
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

    const newMessage = await createMessageInDB({
      projectId,
      content: content.trim(),
      user: {
        name: session.user?.name ?? 'Utilisateur inconnu',
        email: session.user?.email ?? 'unknown@example.com',
        avatar: session.user?.image ?? undefined
      }
    });

    return NextResponse.json({
      message: newMessage,
      success: true
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur lors de la création du message' 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}