import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Notification from '@/app/models/Notification';

// Stockage global partagé entre toutes les instances
const clients = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response('Non autorisé', { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    console.log(`🔗 Tentative de connexion SSE pour l'utilisateur ${userId}`);

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    let isConnected = true;

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`✅ SSE connecté pour l'utilisateur ${userId}`);

        // Stocker le contrôleur dans la Map globale
        clients.set(userId, controller);

        const sendEvent = (data: any) => {
          try {
            const eventData = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(eventData));
          } catch (error) {
            console.error('Erreur envoi événement SSE:', error);
          }
        };

        // Événement de connexion
        sendEvent({
          type: 'connected',
          message: 'Connecté au flux de notifications',
          timestamp: new Date().toISOString()
        });

        // Vérifier les notifications existantes
        try {
          const unreadCount = await Notification.countDocuments({
            userId: userId,
            read: false
          });

          sendEvent({
            type: 'heartbeat',
            unreadCount,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Erreur vérification notifications:', error);
        }

        // Vérifier périodiquement
        const interval = setInterval(async () => {
          if (!isConnected) return;

          try {
            const unreadCount = await Notification.countDocuments({
              userId: userId,
              read: false
            });

            sendEvent({
              type: 'heartbeat',
              unreadCount,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error('Erreur vérification notifications:', error);
          }
        }, 30000);

        // Gérer la déconnexion
        request.signal.addEventListener('abort', () => {
          console.log(`🔗 SSE déconnecté pour l'utilisateur ${userId}`);
          isConnected = false;
          clearInterval(interval);
          clients.delete(userId);
          controller.close();
        });

      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('❌ Erreur SSE:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
}

// Fonction utilitaire pour émettre des événements
export function emitEventToUser(userId: string, event: any) {
  const controller = clients.get(userId);
  if (controller) {
    try {
      const eventData = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(new TextEncoder().encode(eventData));
      console.log(`📨 Événement émis à ${userId}:`, event.type);
      return true;
    } catch (error) {
      console.error('Erreur émission événement:', error);
      return false;
    }
  }
  console.log(`⚠️ Utilisateur ${userId} non connecté au SSE`);
  return false;
}