// lib/message-utils.ts
import { MongoClient, ObjectId } from 'mongodb';

// Types corrigés avec attachments
export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface MessageUser {
  name: string;
  email: string;
  avatar?: string | null;
}

export interface Message {
  _id: string;
  content: string;
  user: MessageUser;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

interface CreateMessageData {
  projectId: string;
  content: string;
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
    avatar?: string | null | undefined;
  };
  attachments?: Attachment[];
}

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('scientific-collab');
const messagesCollection = db.collection<Omit<Message, '_id'> & { _id: ObjectId }>('messages');

export async function fetchMessagesFromDB(projectId: string): Promise<Message[]> {
  try {
    await client.connect();
    
    const messages = await messagesCollection
      .find({ projectId })
      .sort({ createdAt: 1 })
      .toArray();

    return messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      createdAt: msg.createdAt.toString(),
      updatedAt: msg.updatedAt.toString(),
      user: {
        ...msg.user,
        avatar: msg.user.avatar || undefined // Nettoyage des valeurs null
      },
      attachments: msg.attachments ? msg.attachments.map(att => ({
        ...att,
        _id: att._id.toString()
      })) : undefined
    }));
  } catch (error) {
    console.error('Error fetching messages from DB:', error);
    throw new Error('Erreur lors de la récupération des messages');
  } finally {
    await client.close();
  }
}

export async function createMessageInDB(messageData: CreateMessageData): Promise<Message> {
  try {
    await client.connect();
    
    const userName = messageData.user.name || 'Utilisateur inconnu';
    const userEmail = messageData.user.email || 'unknown@example.com';
    const userAvatar = messageData.user.avatar || undefined;

    const newMessage = {
      content: messageData.content,
      projectId: messageData.projectId,
      user: {
        name: userName,
        email: userEmail,
        avatar: userAvatar
      },
      attachments: messageData.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await messagesCollection.insertOne(newMessage as any);
    
    return {
      ...newMessage,
      _id: result.insertedId.toString(),
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString(),
      attachments: newMessage.attachments.map(att => ({
        ...att,
        uploadedAt: att.uploadedAt || newMessage.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error('Error creating message in DB:', error);
    throw new Error('Erreur lors de la création du message');
  } finally {
    await client.close();
  }
}

// Fonction utilitaire pour générer un ID d'attachment
export function generateAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}