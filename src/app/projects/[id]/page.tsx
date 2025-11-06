'use client';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  FiEdit3, 
  FiUsers, 
  FiTrash2, 
  FiArrowLeft, 
  FiCalendar,
  FiTag,
  FiUser,
  FiGlobe,
  FiBook,
  FiActivity,
  FiShare2,
  FiCheck,
  FiMoreVertical,
  FiAward,
  FiClock,
  FiAlertTriangle,
  FiHome
} from 'react-icons/fi';
import InviteCollaboratorModal from '@/app/components/InviteCollaboratorModal';
import DocumentManager from '@/app/components/DocumentManager';
import ProjectTimeline from '@/app/components/ProjectTimeline';
import QuickChat from '@/app/components/QuickChat';
import NotificationCenter from '@/app/components/NotificationCenter';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  visibility: 'PRIVATE' | 'PUBLIC' | 'INSTITUTION';
  tags: string[];
  discipline: string;
  owner: {
    _id: string;
    name: string;
    email: string;
    affiliation: string;
  };
  collaborators: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      affiliation: string;
    };
    role: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetail() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

 const projectId = params?.id as string;

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/research/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        console.error('Error fetching project');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

   const handleEdit = () => {
    if (!projectId) return;
    router.push(`/projects/edit/${projectId}`);
  };

  const handleInvite = () => {
    setShowInviteModal(true);
    setShowMobileMenu(false);
  };

   const handleInviteSent = () => {
    if (projectId) {
      fetchProject(projectId);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
    setShowMobileMenu(false);
  };

  const handleDelete = async () => {
    try {
      if (!projectId) return;
      const response = await fetch(`/api/research/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        localStorage.setItem('deleteSuccess', 'true');
        localStorage.setItem('deletedProjectTitle', project?.title || '');
        router.push('/dashboard');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error);
        } else {
          const errorText = await response.text();
          throw new Error(errorText || 'Impossible de supprimer le projet');
        }
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(`❌ Échec de la suppression : ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const copyProjectLink = () => {
    const url = `${window.location.origin}/projects/${project?._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'from-emerald-500 to-green-500 text-white',
          label: 'Actif',
          icon: <FiActivity className="w-4 h-4" />
        };
      case 'COMPLETED':
        return {
          color: 'from-blue-500 to-cyan-500 text-white',
          label: 'Terminé',
          icon: <FiAward className="w-4 h-4" />
        };
      case 'PAUSED':
        return {
          color: 'from-amber-500 to-orange-500 text-white',
          label: 'En pause',
          icon: <FiClock className="w-4 h-4" />
        };
      default:
        return {
          color: 'from-gray-500 to-slate-500 text-white',
          label: status,
          icon: <FiActivity className="w-4 h-4" />
        };
    }
  };

  const getVisibilityInfo = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return {
          color: 'from-rose-500 to-pink-500',
          label: 'Privé',
          icon: <FiUser className="w-4 h-4" />,
          description: 'Seul vous et les collaborateurs pouvez voir ce projet'
        };
      case 'PUBLIC':
        return {
          color: 'from-emerald-500 to-teal-500',
          label: 'Public',
          icon: <FiGlobe className="w-4 h-4" />,
          description: 'Tout le monde peut voir ce projet'
        };
      case 'INSTITUTION':
        return {
          color: 'from-indigo-500 to-purple-500',
          label: 'Institution',
          icon: <FiBook className="w-4 h-4" />,
          description: 'Visible par les membres de votre institution'
        };
      default:
        return {
          color: 'from-gray-500 to-slate-500',
          label: visibility,
          icon: <FiUser className="w-4 h-4" />,
          description: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-md">
          <div className="w-16 h-16 bg-linear-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBook className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Projet non trouvé</h2>
          <p className="text-slate-600 mb-6">Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === project.owner._id;
  const statusInfo = getStatusInfo(project.status);
  const visibilityInfo = getVisibilityInfo(project.visibility);

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-white/50"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{project.title}</h1>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-linear-to-r ${statusInfo.color} shadow-sm mt-2 sm:mt-0`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                    <p className="text-slate-600 text-base sm:text-lg truncate">{project.description}</p>
                  </div>
                </div>
                
                <div className="hidden lg:flex items-center space-x-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50 backdrop-blur-sm"
                    title="Retour au Dashboard"
                  >
                    <FiHome className="w-5 h-5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>

                  <NotificationCenter />

                  <button
                    onClick={copyProjectLink}
                    className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50 backdrop-blur-sm"
                  >
                    {copied ? <FiCheck className="w-5 h-5 text-emerald-600" /> : <FiShare2 className="w-5 h-5" />}
                    <span className="hidden sm:inline">{copied ? 'Copié!' : 'Partager'}</span>
                  </button>
                  
                  {isOwner && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleInvite}
                        className="flex items-center space-x-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        <FiUsers className="w-5 h-5" />
                        <span className="hidden sm:inline">Inviter</span>
                      </button>
                      <button 
                        onClick={handleEdit}
                        className="flex items-center space-x-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        <FiEdit3 className="w-5 h-5" />
                        <span className="hidden sm:inline">Éditer</span>
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex items-center space-x-2 bg-linear-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        <FiTrash2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>
                  )}
                  {!isOwner && (
                    <span className="text-sm text-slate-600 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                      Collaborateur
                    </span>
                  )}
                </div>

                {/* Actions Mobile */}
                <div className="lg:hidden flex items-center space-x-2">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50"
                    title="Dashboard"
                  >
                    <FiHome className="w-5 h-5" />
                  </button>

                  <NotificationCenter />

                  <button
                    onClick={copyProjectLink}
                    className="flex items-center p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50"
                  >
                    {copied ? <FiCheck className="w-5 h-5 text-emerald-600" /> : <FiShare2 className="w-5 h-5" />}
                  </button>
                  
                  {isOwner && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className={`flex items-center p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50 ${
                          showMobileMenu ? 'bg-white/50' : ''
                        }`}
                      >
                        <FiMoreVertical className="w-5 h-5" />
                      </button>
                      
                    {showMobileMenu && (
  <>
    <div 
      className="fixed inset-0 z-100"
      onClick={() => setShowMobileMenu(false)}
    />
    
    <div className="fixed right-4 top-20 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-100 min-w-48 max-w-[calc(100vw-2rem)] transform transition-all duration-200">
                            <button
                              onClick={() => {
                                handleInvite();
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-slate-700 hover:bg-slate-50/80 transition-colors text-left"
                            >
                              <div className="w-8 h-8 bg-linear-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0">
                                <FiUsers className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium block truncate">Inviter</span>
                                <span className="text-xs text-slate-500 truncate">Ajouter un collaborateur</span>
                              </div>
                            </button>
                            
                            <div className="border-t border-slate-200/50 mx-3 my-1"></div>
                            
                            <button
                              onClick={() => {
                                handleEdit();
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-slate-700 hover:bg-slate-50/80 transition-colors text-left"
                            >
                              <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                                <FiEdit3 className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium block truncate">Éditer</span>
                                <span className="text-xs text-slate-500 truncate">Modifier le projet</span>
                              </div>
                            </button>
                            
                            <div className="border-t border-slate-200/50 mx-3 my-1"></div>
                            
                            <button
                              onClick={() => {
                                confirmDelete();
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-rose-700 hover:bg-rose-50/80 transition-colors text-left"
                            >
                              <div className="w-8 h-8 bg-linear-to-r from-rose-500 to-pink-600 rounded-lg flex items-center justify-center shrink-0">
                                <FiTrash2 className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium block truncate">Supprimer</span>
                                <span className="text-xs text-rose-500 truncate">Action irréversible</span>
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {!isOwner && (
                    <span className="text-sm text-slate-600 px-3 py-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                      Collaborateur
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className=" rounded-2xl shadow-lg border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Description détaillée</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.description}</p>
              </div>

              <DocumentManager projectId={project._id} isOwner={isOwner} />
              <ProjectTimeline projectId={project._id} />

              {/* Informations du Projet */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Informations du projet</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500 block mb-2">Discipline</label>
                      <div className="flex items-center space-x-2 text-slate-900">
                        <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <FiBook className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{project.discipline || 'Non spécifiée'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-500 block mb-2">Visibilité</label>
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          {visibilityInfo.icon}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{visibilityInfo.label}</span>
                          <p className="text-sm text-slate-500">{visibilityInfo.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500 block mb-2">Créé le</label>
                      <div className="flex items-center space-x-2 text-slate-900">
                        <div className="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                          <FiCalendar className="w-5 h-5 text-white" />
                        </div>
                        <span>
                          {new Date(project.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric',
                            month: 'long', 
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-500 block mb-2">Dernière modification</label>
                      <div className="flex items-center space-x-2 text-slate-900">
                        <div className="w-10 h-10 bg-linear-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                          <FiClock className="w-5 h-5 text-white" />
                        </div>
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric',
                            month: 'long', 
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <FiUser className="w-5 h-5 text-blue-500" />
                  <span>Propriétaire</span>
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {project.owner.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{project.owner.name}</p>
                    <p className="text-sm text-slate-500 truncate">{project.owner.email}</p>
                    {project.owner.affiliation && (
                      <p className="text-sm text-slate-500 truncate">{project.owner.affiliation}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <FiTag className="w-5 h-5 text-emerald-500" />
                  <span>Mots-clés</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm bg-linear-to-r from-emerald-100 to-blue-100 text-slate-700 rounded-full border border-emerald-200/50"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">Aucun mot-clé</p>
                  )}
                </div>
              </div>

              {project.collaborators && project.collaborators.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <FiUsers className="w-5 h-5 text-purple-500" />
                    <span>Collaborateurs ({project.collaborators.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {project.collaborators.map((collab, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-linear-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {collab.user.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{collab.user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{collab.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <QuickChat projectId={project._id} />
            </div>
          </div>
        </main>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-linear-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Confirmer la suppression
              </h3>
              
              <p className="text-slate-600 mb-2">
                Vous êtes sur le point de supprimer le projet :
              </p>
              
              <p className="font-semibold text-slate-900 mb-4 text-lg">
                "{project.title}"
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2 text-rose-800">
                  <FiAlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Cette action est irréversible</p>
                    <p className="text-xs mt-1">
                      Toutes les données, collaborations et historiques associés à ce projet seront définitivement supprimés.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {project && (
        <InviteCollaboratorModal
          projectId={project._id}
          projectTitle={project.title}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={handleInviteSent}
        />
      )}
    </>
  );
}