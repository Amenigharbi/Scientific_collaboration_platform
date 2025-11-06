'use client';

import { JSX, useState } from 'react';
import { 
  FiX, 
  FiMail, 
  FiUsers, 
  FiEye,
  FiEdit3,
  FiShield,
  FiLoader,
  FiCheck,
  FiSend,
  FiMessageCircle
} from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';

interface InviteCollaboratorModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

type RoleType = 'VIEWER' | 'CONTRIBUTOR' | 'MAINTAINER';

interface RoleInfo {
  icon: JSX.Element;
  title: string;
  description: string;
  permissions: string[];
  color: string;
  badgeColor: string;
}

export default function InviteCollaboratorModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onInviteSent
}: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>('CONTRIBUTOR');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const { emitAction } = useNotifications();

  const getRoleInfo = (role: RoleType): RoleInfo => {
    const roleInfo: Record<RoleType, RoleInfo> = {
      VIEWER: {
        icon: <FiEye className="w-4 h-4" />,
        title: 'Observateur',
        description: 'Accès en lecture seule',
        permissions: [
          'Voir le projet et ses données',
          'Consulter les documents',
          'Voir les activités'
        ],
        color: 'from-blue-500 to-cyan-500',
        badgeColor: 'bg-blue-500'
      },
      CONTRIBUTOR: {
        icon: <FiEdit3 className="w-4 h-4" />,
        title: 'Contributeur',
        description: 'Peut modifier et contribuer',
        permissions: [
          'Toutes les permissions Observateur',
          'Modifier le contenu',
          'Ajouter des données',
          'Créer des documents'
        ],
        color: 'from-green-500 to-emerald-500',
        badgeColor: 'bg-green-500'
      },
      MAINTAINER: {
        icon: <FiShield className="w-4 h-4" />,
        title: 'Mainteneur',
        description: 'Gestion complète',
        permissions: [
          'Toutes les permissions Contributeur',
          'Gérer les collaborateurs',
          'Modifier les paramètres',
          'Archiver le projet'
        ],
        color: 'from-purple-500 to-violet-500',
        badgeColor: 'bg-purple-500'
      }
    };
    return roleInfo[role];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userEmail: email.trim(),
          role,
          customMessage: customMessage.trim() || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('🎉 Invitation envoyée avec succès !');
        setEmail('');
        setCustomMessage('');
        
        // Émettre une action SSE
        emitAction({
          type: 'collaborator_invited',
          title: 'Collaborateur invité',
          message: `Une invitation a été envoyée à ${email.trim()} pour rejoindre le projet`,
          metadata: {
            projectId: projectId,
            projectTitle: projectTitle,
            invitedEmail: email.trim(),
            role: role,
            invitedBy: 'Vous'
          }
        });
        
        setTimeout(() => {
          onInviteSent();
          onClose();
        }, 1500);
      } else {
        setMessage(`❌ ${data.error || 'Erreur lors de l\'envoi de l\'invitation'}`);
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentRoleInfo = getRoleInfo(role);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-100 transition-opacity duration-300"
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-purple-500/10"></div>
      </div>
      
      {/* Modal compact */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 relative overflow-hidden">
        {/* Effet de bordure lumineuse */}
        <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl"></div>
        
        {/* Header compact */}
        <div className="relative p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Inviter un collaborateur
                </h2>
                <p className="text-xs text-white/70 truncate max-w-[200px]">
                  Projet: {projectTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-white/70 hover:text-white"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative p-5 space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email du collaborateur *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-4 w-4 text-white/60" />
              </div>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/40 backdrop-blur-sm text-sm"
                placeholder="collaborateur@exemple.com"
              />
            </div>
          </div>

          {/* Role Selection compacte */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Rôle
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(['VIEWER', 'CONTRIBUTOR', 'MAINTAINER'] as RoleType[]).map((roleOption) => {
                const roleInfo = getRoleInfo(roleOption);
                const isSelected = role === roleOption;
                
                return (
                  <div
                    key={roleOption}
                    onClick={() => setRole(roleOption)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                      isSelected
                        ? `bg-linear-to-r ${roleInfo.color} border-white/30 shadow-lg`
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-white/20' : 'bg-white/10'
                        }`}>
                          {roleInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-white text-sm">{roleInfo.title}</h3>
                            <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.badgeColor}`}></span>
                          </div>
                          <p className="text-xs text-white/70">{roleInfo.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <FiCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Permissions affichées de manière plus compacte */}
                    {isSelected && (
                      <div className="mt-2">
                        <div className="text-xs text-white/80 space-y-1">
                          {roleInfo.permissions.slice(0, 2).map((permission, index) => (
                            <div key={index} className="flex items-center space-x-1.5">
                              <div className="w-1 h-1 bg-white/60 rounded-full shrink-0"></div>
                              <span className="leading-tight">{permission}</span>
                            </div>
                          ))}
                          {roleInfo.permissions.length > 2 && (
                            <div className="text-white/60 text-xs">
                              +{roleInfo.permissions.length - 2} autres permissions
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Message compact */}
          <div>
            <label htmlFor="customMessage" className="block text-sm font-medium text-white mb-2">
              Message (optionnel)
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none">
                <FiMessageCircle className="h-4 w-4 text-white/60" />
              </div>
              <textarea
                id="customMessage"
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none text-white placeholder-white/40 backdrop-blur-sm text-sm"
                placeholder="Message personnalisé..."
              />
            </div>
          </div>

          {/* Message d'état compact */}
          {message && (
            <div className={`p-3 rounded-lg border backdrop-blur-sm ${
              message.includes('❌')
                ? 'bg-red-500/10 border-red-400/30 text-red-200'
                : 'bg-green-500/10 border-green-400/30 text-green-200'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{message}</span>
              </div>
            </div>
          )}

          {/* Actions compactes */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-white/20 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm backdrop-blur-sm disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2.5 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-200 font-medium flex items-center space-x-2 text-sm shadow-lg"
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  <span>Inviter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}