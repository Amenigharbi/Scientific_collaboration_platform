// app/components/QuickChat.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';

interface Message {
  _id: string;
  content: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface QuickChatProps {
  projectId: string;
}

export default function QuickChat({ projectId }: QuickChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    // Setup WebSocket ou polling pour les messages en temps réel
  }, [projectId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(); 
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
        <FiMessageSquare className="w-5 h-5 text-green-500" />
        <span>Chat du projet</span>
      </h3>

      <div className="space-y-4">
        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 p-2">
          {messages.map((message) => (
            <div key={message._id} className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-slate-700">
                  {message.user.name}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="bg-slate-100 rounded-lg p-3">
                <p className="text-sm text-slate-800">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulaire d'envoi */}
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="bg-linear-to-r from-green-500 to-teal-600 text-white p-2 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}