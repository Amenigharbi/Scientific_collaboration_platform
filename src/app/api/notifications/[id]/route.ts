import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Notification from '@/app/models/Notification';
import { Types } from 'mongoose';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const result = await Notification.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(id), 
        userId: new Types.ObjectId(session.user.id) 
      },
      { read: true },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      notification: {
        ...result.toObject(),
        _id: result._id.toString(),
        userId: result.userId.toString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur marquer comme lu:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const result = await Notification.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(session.user.id)
    });

    if (!result) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification supprimée'
    });

  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}