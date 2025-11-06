// app/api/documents/project/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/lib/mongodb';
import Document from '@/app/models/Document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { projectId } = await params;

    await connectToDatabase();

    const documents = await Document.find({ projectId })
      .sort({ createdAt: -1 });

    const formattedDocuments = documents.map(doc => ({
      _id: doc._id.toString(),
      name: doc.name,
      fileName: doc.fileName,
      size: doc.size,
      type: doc.type,
      projectId: doc.projectId.toString(),
      url: doc.url, // Utiliser l'URL stockée en base
      createdAt: doc.createdAt.toISOString(),
      uploadedBy: {
        name: session.user.name,
        email: session.user.email
      }
    }));

    console.log('📄 Formatted documents:', formattedDocuments);

    return NextResponse.json({ documents: formattedDocuments });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}