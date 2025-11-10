'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageSquare, FiClock, FiAlertCircle, FiRefreshCw, FiCheck, FiPaperclip, FiX, FiFile } from 'react-icons/fi';
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
  attachments?: Attachment[];
}

interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface QuickChatProps {
  projectId: string;
  className?: string;
}

interface FilePreview {
  file: File;
  previewUrl?: string;
  id: string;
}

const MessageItem = React.memo(({ message, isOwn }: { message: Message; isOwn: boolean }) => (
  <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
      isOwn 
        ? 'bg-linear-to-r from-blue-500 to-purple-600' 
        : 'bg-linear-to-r from-slate-500 to-slate-600'
    }`}>
      {message.user.name?.charAt(0).toUpperCase() || 'U'}
    </div>

    <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 mb-1">
        {!isOwn && (
          <span className="text-sm font-medium text-slate-700">{message.user.name}</span>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-400">
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
        className={`rounded-2xl px-4 py-3 shadow-sm ${
          isOwn
            ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{message.content}</p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment._id} className="flex items-center gap-2 p-2 bg-white/20 rounded-lg">
                <FiFile className="w-4 h-4" />
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:underline truncate max-w-[200px]"
                  title={attachment.originalName}
                >
                  {attachment.originalName}
                </a>
                <span className="text-xs opacity-75">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwn && (
        <div className="flex items-center gap-1 mt-1">
          <FiCheck className="w-3 h-3 text-green-500" />
          <span className="text-xs text-slate-400">Envoyé</span>
        </div>
      )}
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
  const [isOnline, setIsOnline] = useState(true);
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

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
      setIsOnline(true);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Impossible de charger les messages');
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).map(file => {
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      return {
        file,
        previewUrl,
        id: Math.random().toString(36).substr(2, 9)
      };
    });

    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || isSending) return;

    setIsSending(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('content', newMessage.trim());
      
      attachments.forEach((attachment, index) => {
        formData.append(`attachments`, attachment.file);
      });

      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        body: formData
      });

      const data = await handleApiResponse(response);
      setNewMessage('');
      setAttachments([]);
      
      setMessages(prev => [...prev, data.message]);
      setIsOnline(true);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message');
      setIsOnline(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: messages.length > 10 ? 'smooth' : 'auto' 
        });
      }
    }
  }, [messages.length]);

  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [attachments]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const retryFetch = () => {
    fetchMessages();
  };

  const formatMessageCount = (count: number) => {
    if (count === 0) return 'Aucun message';
    if (count === 1) return '1 message';
    return `${count} messages`;
  };

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
      <div className="bg-linear-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-linear-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiMessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Chat du projet</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-slate-600">
                  {isOnline ? 'En ligne' : 'Hors ligne'} • {formatMessageCount(messages.length)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={fetchMessages}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-all duration-200 disabled:opacity-50"
            title="Actualiser les messages"
          >
            <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col h-[500px]">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-linear-to-b from-slate-50/50 to-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-red-800 font-medium text-sm">Erreur de connexion</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={retryFetch}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-xl transition-colors text-sm font-medium"
              >
                Réessayer
              </button>
            </div>
          )}

          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <p className="text-slate-500 text-sm">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FiMessageSquare className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-600">Aucun message</p>
                <p className="text-sm">Soyez le premier à envoyer un message !</p>
              </div>
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
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className="border-t border-slate-200/50 bg-white p-6">
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    {attachment.previewUrl ? (
                      <img 
                        src={attachment.previewUrl} 
                        alt="Preview" 
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <FiFile className="w-5 h-5 text-slate-500" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                        {attachment.file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatFileSize(attachment.file.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    type="button"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isSending && (
            <div className="flex items-center space-x-2 mb-3 text-slate-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Envoi en cours...</span>
            </div>
          )}

          <form onSubmit={sendMessage} className="space-y-3">
            <div className="flex space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files)}
                multiple
                className="hidden"
                accept="*/*"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center transition-colors text-slate-600"
                title="Joindre un fichier"
              >
                <FiPaperclip className="w-5 h-5" />
              </button>

              <div 
                className={`flex-1 relative transition-all duration-200 ${
                  isDragOver ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Tapez votre message ou glissez-déposez des fichiers..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none min-h-12 max-h-32 text-sm placeholder-slate-400 transition-all duration-200 text-slate-900" // Ajout de text-slate-900
                    disabled={isSending}
                    rows={1}
                />
              </div>

              <button
                type="submit"
                disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
                className="shrink-0 w-12 h-12 bg-linear-to-r from-green-500 to-teal-600 text-white rounded-2xl hover:from-green-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                title="Envoyer le message"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-800 px-1">
              <span>
                {formatMessageCount(messages.length)}
                {attachments.length > 0 && ` • ${attachments.length} fichier(s)`}
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Enter</kbd>
                <span>pour envoyer</span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}