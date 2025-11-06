// app/api/documents/download/[projectId]/[fileName]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Attendre les params
    const { projectId, fileName } = await params;

    console.log('📥 Download request:', { projectId, fileName });

    const filePath = join(process.cwd(), 'uploads', projectId, fileName);
    console.log('📁 File path:', filePath);

    // Vérifier si le fichier existe
    try {
      await readFile(filePath);
    } catch (error) {
      console.error('❌ File not found:', error);
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    const fileExtension = fileName.split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
    };

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeTypes[fileExtension || ''] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('❌ Error serving file:', error);
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}