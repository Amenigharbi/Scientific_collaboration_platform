import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchMessagesFromDB, createMessageInDB } from '@/app/lib/message-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> } 
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
  { params }: { params: Promise<{ projectId: string }> } 
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

    const contentType = request.headers.get('content-type') || '';
    
    let content = '';
    let attachments: any[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = formData.get('content') as string || '';
      
      const files = formData.getAll('attachments') as File[];
      
      attachments = await processAttachments(files);
      
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      content = body.content || '';
    } else {
      return NextResponse.json(
        { error: 'Type de contenu non supporté' },
        { status: 400 }
      );
    }

    if ((!content || content.trim().length === 0) && attachments.length === 0) {
      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

    const newMessage = await createMessageInDB({
      projectId,
      content: content ? content.trim() : '',
      user: {
        name: session.user?.name ?? 'Utilisateur inconnu',
        email: session.user?.email ?? 'unknown@example.com',
        avatar: session.user?.image ?? undefined
      },
      attachments: attachments.length > 0 ? attachments : undefined
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

async function processAttachments(files: File[]): Promise<any[]> {
  const attachments = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;
    const attachment = await saveFileLocally(file);
    attachments.push(attachment);
  }

  return attachments;
}

async function saveFileLocally(file: File): Promise<any> {
  const timestamp = Date.now();
  const originalName = file.name;
  const fileExtension = originalName.split('.').pop();
  const filename = `attachment_${timestamp}.${fileExtension}`;
  
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  

  return {
    _id: `att_${timestamp}`,
    filename: filename,
    originalName: originalName,
    mimetype: file.type,
    size: file.size,
    url: `/api/uploads/${filename}`,
    uploadedAt: new Date().toISOString()
  };
}