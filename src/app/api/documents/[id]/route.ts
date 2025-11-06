// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { connectToDatabase } from '@/app/lib/mongodb';
import Document from '@/app/models/Document';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const documentId = id;

    await connectToDatabase();

    const document = await Document.findById(documentId);

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    if (document.uploadedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const filePath = join(process.cwd(), 'uploads', document.projectId.toString(), document.fileName);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await Document.findByIdAndDelete(documentId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}