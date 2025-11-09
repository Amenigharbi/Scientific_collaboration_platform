import Notification, { INotification } from '@/app/models/Notification';
import { connectToDatabase } from '@/app/lib/mongodb';
import { Types } from 'mongoose';

interface NotificationResponse {
  _id: string;
  userId: string;
  type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT' | 'ACTION';
  title: string;
  message: string;
  read: boolean;
  metadata?: {
    projectId?: string;
    documentId?: string;
    senderId?: string;
    invitationId?: string;
    senderName?: string;
    senderEmail?: string;
    projectTitle?: string;
    actionId?: string;
    actionType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class NotificationService {
  // Créer une notification
  static async createNotification(notificationData: {
    userId: string;
    type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT' | 'ACTION';
    title: string;
    message: string;
    metadata?: any;
  }): Promise<INotification> {
    await connectToDatabase();
    
    const notification = new Notification({
      ...notificationData,
      userId: new Types.ObjectId(notificationData.userId),
      metadata: notificationData.metadata ? {
        ...notificationData.metadata,
        projectId: notificationData.metadata.projectId ? new Types.ObjectId(notificationData.metadata.projectId) : undefined,
        documentId: notificationData.metadata.documentId ? new Types.ObjectId(notificationData.metadata.documentId) : undefined,
        senderId: notificationData.metadata.senderId ? new Types.ObjectId(notificationData.metadata.senderId) : undefined,
        invitationId: notificationData.metadata.invitationId ? new Types.ObjectId(notificationData.metadata.invitationId) : undefined,
        actionId: notificationData.metadata.actionId ? new Types.ObjectId(notificationData.metadata.actionId) : undefined,
      } : undefined
    });
    
    return await notification.save();
  }

  static async getUserNotifications(userId: string, limit: number = 50): Promise<{
    notifications: NotificationResponse[];
    unreadCount: number;
  }> {
    await connectToDatabase();
    
    const notifications = await Notification.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ 
        'metadata.senderId': { _id: Types.ObjectId; name: string; email: string },
        'metadata.projectId': { _id: Types.ObjectId; title: string }
      }>('metadata.senderId', 'name email')
      .populate('metadata.projectId', 'title')
      .lean<INotification[]>();

    const unreadCount = await Notification.countDocuments({ 
      userId: new Types.ObjectId(userId), 
      read: false 
    });

    const transformedNotifications: NotificationResponse[] = notifications.map(notif => {
      const sender = notif.metadata?.senderId as any;
      const project = notif.metadata?.projectId as any;

      return {
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        metadata: {
          projectId: notif.metadata?.projectId?.toString(),
          documentId: notif.metadata?.documentId?.toString(),
          senderId: notif.metadata?.senderId?.toString(),
          invitationId: notif.metadata?.invitationId?.toString(),
          actionId: notif.metadata?.actionId?.toString(),
          actionType: notif.metadata?.actionType,
          senderName: sender?.name,
          senderEmail: sender?.email,
          projectTitle: project?.title
        },
        createdAt: notif.createdAt.toISOString(),
        updatedAt: notif.updatedAt.toISOString()
      };
    });

    return {
      notifications: transformedNotifications,
      unreadCount
    };
  }

  static async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    await connectToDatabase();
    
    return await Notification.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(notificationId), 
        userId: new Types.ObjectId(userId) 
      },
      { read: true },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    await connectToDatabase();
    
    const result = await Notification.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true }
    );
    
    return { modifiedCount: result.modifiedCount || 0 };
  }

  static async deleteNotification(notificationId: string, userId: string): Promise<INotification | null> {
    await connectToDatabase();
    
    return await Notification.findOneAndDelete({ 
      _id: new Types.ObjectId(notificationId), 
      userId: new Types.ObjectId(userId) 
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    await connectToDatabase();
    
    return await Notification.countDocuments({ 
      userId: new Types.ObjectId(userId), 
      read: false 
    });
  }

  static async createAndEmitNotification(
    notificationData: {
      userId: string;
      type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT' | 'ACTION';
      title: string;
      message: string;
      metadata?: any;
    },
    emitFunction?: (userId: string, notification: NotificationResponse) => void
  ): Promise<INotification> {
    const notification = await this.createNotification(notificationData);
    
    if (emitFunction) {
      const notificationForClient: NotificationResponse = {
        _id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        metadata: notification.metadata ? {
          projectId: notification.metadata.projectId?.toString(),
          documentId: notification.metadata.documentId?.toString(),
          senderId: notification.metadata.senderId?.toString(),
          invitationId: notification.metadata.invitationId?.toString(),
          actionId: notification.metadata.actionId?.toString(),
          actionType: notification.metadata.actionType
        } : undefined,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString()
      };
      
      emitFunction(notificationData.userId, notificationForClient);
    }
    
    return notification;
  }

  static formatNotificationForClient(notification: INotification): NotificationResponse {
    return {
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      metadata: notification.metadata ? {
        projectId: notification.metadata.projectId?.toString(),
        documentId: notification.metadata.documentId?.toString(),
        senderId: notification.metadata.senderId?.toString(),
        invitationId: notification.metadata.invitationId?.toString(),
        actionId: notification.metadata.actionId?.toString(),
        actionType: notification.metadata.actionType
      } : undefined,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString()
    };
  }

  static async createActionNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: {
      actionId?: string;
      actionType?: string;
      projectId?: string;
      documentId?: string;
    }
  ): Promise<INotification> {
    return await this.createNotification({
      userId,
      type: 'ACTION',
      title,
      message,
      metadata
    });
  }
}