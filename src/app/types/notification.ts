export interface Notification {
  _id: string;
  userId: string;
  type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT';
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
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}