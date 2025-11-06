// app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { connectToDatabase } from '@/app/lib/mongodb';
import Document from '@/app/models/Document';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Fichier et projet ID requis' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${generateUUID()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'uploads', projectId);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    await connectToDatabase();

    // CORRECTION : URL correcte pour le téléchargement
    const documentData = {
      name: file.name,
      fileName: fileName,
      size: file.size,
      type: file.type,
      projectId: projectId,
      uploadedBy: session.user.id,
      url: `/api/documents/download/${projectId}/${fileName}`, // URL corrigée
    };

    const document = await Document.create(documentData);

    return NextResponse.json({
      _id: document._id,
      name: document.name,
      fileName: document.fileName,
      size: document.size,
      type: document.type,
      projectId: document.projectId,
      url: document.url,
      createdAt: document.createdAt,
      uploadedBy: {
        name: session.user.name,
        email: session.user.email
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
  }
}