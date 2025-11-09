import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Notification, { INotification } from '@/app/models/Notification';
import { Types } from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();

    if (!Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const notifications = await Notification.find({ 
      userId: new Types.ObjectId(session.user.id)
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<INotification[]>();

    const unreadCount = await Notification.countDocuments({
      userId: new Types.ObjectId(session.user.id),
      read: false
    });

    interface TransformedNotification {
      _id: string;
      userId: string;
      type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT' | 'ACTION';
      title: string;
      message: string;
      read: boolean;
      metadata?: any;
      createdAt: string;
      updatedAt: string;
    }

    const transformedNotifications: TransformedNotification[] = notifications.map(notif => ({
      ...notif,
      _id: notif._id.toString(),
      userId: notif.userId.toString(),
      createdAt: notif.createdAt.toISOString(),
      updatedAt: notif.updatedAt.toISOString()
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount
    });

  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectToDatabase();

    if (!Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const result = await Notification.updateMany(
      { 
        userId: new Types.ObjectId(session.user.id), 
        read: false 
      },
      { read: true }
    );

    console.log('✅ Notifications marquées comme lues:', result.modifiedCount);

    return NextResponse.json({ 
      success: true,
      updatedCount: result.modifiedCount 
    });

  } catch (error) {
    console.error('❌ Erreur marquer tout comme lu:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}