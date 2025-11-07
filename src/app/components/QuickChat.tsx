// app/components/QuickChat.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageSquare, FiUser, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import React from 'react';

interface Message {
  _id: string;
  content: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

interface QuickChatProps {
  projectId: string;
  className?: string;
}

const MessageItem = React.memo(({ message, isOwn }: { message: Message; isOwn: boolean }) => (
  <div className={`flex flex-col space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
    <div className="flex items-center space-x-2 text-sm">
      {!isOwn && (
        <div className="flex items-center space-x-1">
          <FiUser className="w-3 h-3 text-slate-500" />
          <span className="font-medium text-slate-700">{message.user.name}</span>
        </div>
      )}
      <div className="flex items-center space-x-1 text-slate-400">
        <FiClock className="w-3 h-3" />
        <span>
          {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
    <div
      className={`rounded-lg p-3 max-w-[80%] ${
        isOwn
          ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white'
          : 'bg-slate-100 text-slate-800'
      }`}
    >
      <p className="text-sm wrap-break-word">{message.content}</p>
    </div>
  </div>
));

MessageItem.displayName = 'MessageItem';

export default function QuickChat({ projectId, className = '' }: QuickChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();

  // Fonction utilitaire pour gérer les réponses API
  const handleApiResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('API returned non-JSON response:', text.substring(0, 200));
      throw new Error(`Le serveur a renvoyé une réponse invalide (${response.status})`);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    return data;
  };

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await handleApiResponse(response);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Impossible de charger les messages');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      const data = await handleApiResponse(response);
      setNewMessage('');
      
      // Mettre à jour les messages localement si WebSocket n'est pas disponible
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Scroll automatique
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: messages.length > 10 ? 'smooth' : 'auto' 
      });
    }
  }, [messages.length]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Réessayer de charger les messages en cas d'erreur
  const retryFetch = () => {
    fetchMessages();
  };

  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
          <FiMessageSquare className="w-5 h-5 text-green-500" />
          <span>Chat du projet</span>
        </h3>
        <button
          onClick={fetchMessages}
          disabled={isLoading}
          className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-4 p-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiAlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={retryFetch}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : messages.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <FiMessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Aucun message</p>
              <p className="text-xs">Soyez le premier à envoyer un message !</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem
                key={message._id}
                message={message}
                isOwn={message.user.email === session?.user?.email}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Indicateur d'envoi */}
        {isSending && (
          <div className="flex justify-center">
            <div className="animate-pulse text-slate-500 text-sm flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
              <span>Envoi en cours...</span>
            </div>
          </div>
        )}

        {/* Formulaire d'envoi */}
        <form onSubmit={sendMessage} className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Tapez votre message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-10 max-h-[120px] text-sm"
              disabled={isSending}
              rows={1}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="bg-linear-to-r from-green-500 to-teal-600 text-white p-2 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-10 h-10"
              title="Envoyer le message"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
            <span>Appuyez sur Entrée pour envoyer</span>
          </div>
        </form>
      </div>
    </div>
  );
}