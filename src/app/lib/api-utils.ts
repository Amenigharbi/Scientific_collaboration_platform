// app/lib/api-utils.ts
import { connectToDatabase } from './mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function withDatabase(handler: Function) {
  return async (...args: any[]) => {
    try {
      await connectToDatabase();
      return await handler(...args);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  };
}

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Non authentifié');
  }
  
  return session.user;
}