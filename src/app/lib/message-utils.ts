// lib/message-utils.ts
import { MongoClient, ObjectId } from 'mongodb';

// Types corrigés
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
}

interface CreateMessageData {
  projectId: string;
  content: string;
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
    avatar?: string | null | undefined;
  };
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
      }
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
    
    // Nettoyage et validation des données utilisateur
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await messagesCollection.insertOne(newMessage as any);
    
    return {
      ...newMessage,
      _id: result.insertedId.toString(),
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error creating message in DB:', error);
    throw new Error('Erreur lors de la création du message');
  } finally {
    await client.close();
  }
}