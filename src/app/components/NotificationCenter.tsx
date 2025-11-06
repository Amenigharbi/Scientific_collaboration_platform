'use client';
import { useState } from 'react';
import { FiBell, FiCheck, FiTrash2, FiWifi, FiWifiOff, FiRefreshCw, FiFile, FiUsers, FiDownload, FiUpload } from 'react-icons/fi';
import { useNotifications } from '@/app/hooks/useNotifications';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    isConnected,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  } = useNotifications();

  const getNotificationIcon = (type: string, actionType?: string) => {
    // Si c'est une action, utiliser l'icône spécifique
    if (type === 'ACTION') {
      switch (actionType) {
        case 'document_uploaded':
          return <FiUpload className="w-5 h-5 text-green-500" />;
        case 'document_downloaded':
          return <FiDownload className="w-5 h-5 text-blue-500" />;
        case 'document_deleted':
          return <FiTrash2 className="w-5 h-5 text-red-500" />;
        case 'collaborator_invited':
          return <FiUsers className="w-5 h-5 text-purple-500" />;
        default:
          return <FiFile className="w-5 h-5 text-slate-500" />;
      }
    }
    
    // Notifications standards
    switch (type) {
      case 'MESSAGE':
        return '💬';
      case 'INVITATION':
        return '📨';
      case 'SYSTEM':
        return '⚙️';
      case 'DOCUMENT':
        return '📄';
      default:
        return '🔔';
    }
  };

  const getActionBadge = (actionType?: string) => {
    if (!actionType) return null;
    
    const badgeConfig: Record<string, { label: string; color: string }> = {
      'document_uploaded': { label: 'Upload', color: 'bg-green-100 text-green-800' },
      'document_downloaded': { label: 'Téléchargement', color: 'bg-blue-100 text-blue-800' },
      'document_deleted': { label: 'Suppression', color: 'bg-red-100 text-red-800' },
      'collaborator_invited': { label: 'Invitation', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = badgeConfig[actionType];
    if (!config) return null;
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50"
      >
        <div className="flex items-center space-x-1">
          <FiBell className="w-6 h-6" />
          {isConnected ? (
            <FiWifi className="w-3 h-3 text-green-500" />
          ) : (
            <FiWifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panneau des notifications */}
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-50 max-h-96">
            {/* En-tête */}
            <div className="px-4 py-2 border-b border-slate-200/50">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refetch}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Actualiser"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Tout lire
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-slate-500">
                  {isConnected ? 'Connecté' : 'Déconnecté'} • 
                  Dernière mise à jour: {formatTime(lastUpdate.toISOString())}
                </span>
              </div>
            </div>
              
            {/* Liste des notifications */}
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-slate-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm mt-2">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <div className="text-2xl mb-2">🔔</div>
                  <p className="text-sm">Aucune notification</p>
                  <p className="text-xs mt-1">Les nouvelles notifications apparaîtront ici</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="shrink-0 mt-0.5">
                          {typeof getNotificationIcon(notification.type, notification.metadata?.actionType) === 'string' ? (
                            <span className="text-lg">
                              {getNotificationIcon(notification.type, notification.metadata?.actionType)}
                            </span>
                          ) : (
                            getNotificationIcon(notification.type, notification.metadata?.actionType)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-slate-900 text-sm">
                              {notification.title}
                            </h4>
                            {getActionBadge(notification.metadata?.actionType)}
                          </div>
                          <p className="text-sm text-slate-600">
                            {notification.message}
                          </p>
                          {notification.metadata?.documentName && (
                            <p className="text-xs text-slate-500 mt-1">
                              📄 {notification.metadata.documentName}
                            </p>
                          )}
                          {notification.metadata?.invitedEmail && (
                            <p className="text-xs text-slate-500 mt-1">
                              👤 {notification.metadata.invitedEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-slate-400 hover:text-green-600 p-1 transition-colors"
                            title="Marquer comme lu"
                          >
                            <FiCheck className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}