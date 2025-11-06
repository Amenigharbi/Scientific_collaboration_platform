'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiPlus, 
  FiUsers, 
  FiFolder, 
  FiMail, 
  FiClock, 
  FiTrendingUp,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiCheck,
  FiX,
  FiSearch,
  FiFilter,
  FiAward,
  FiActivity,
  FiAlertTriangle
} from 'react-icons/fi';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  visibility: string;
  tags: string[];
  discipline: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Collaboration {
  _id: string;
  role: string;
  status: string;
  userEmail: string;
  project: {
    _id: string;
    title: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCollaborations: number;
  pendingInvitations: number;
  recentActivity: number;
}

interface Activity {
  _id: string;
  type: string;
  description: string;
  userId: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'collaborations'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; project: Project | null }>({
    show: false,
    project: null
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalCollaborations: 0,
    pendingInvitations: 0,
    recentActivity: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Charger les projets
      const projectsResponse = await fetch('/api/research');
      const projectsData = await projectsResponse.json();
      const projectsList = projectsData.projects || [];
      setProjects(projectsList);

      // Charger les collaborations
      const collabResponse = await fetch('/api/collaborations?type=received');
      const collabData = await collabResponse.json();
      const collaborationsList = collabData.collaborations || [];
      setCollaborations(collaborationsList);

      // Calculer les statistiques
      calculateStats(projectsList, collaborationsList);

      // Charger les activités récentes
      await fetchRecentActivities();

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projects: Project[], collaborations: Collaboration[]) => {
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const pendingInvitations = collaborations.filter(c => c.status === 'PENDING').length;
    
    // Calcul de l'activité récente basée sur les projets modifiés
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentActivity = projects.filter(p => 
      new Date(p.updatedAt) > oneWeekAgo || 
      new Date(p.createdAt) > oneWeekAgo
    ).length;

    setStats({
      totalProjects: projects.length,
      activeProjects,
      totalCollaborations: collaborations.length,
      pendingInvitations,
      recentActivity
    });
  };

  const fetchRecentActivities = async () => {
    try {
      // Simulation d'activités récentes basées sur les projets
      // À remplacer par un appel API réel si disponible
      const simulatedActivities: Activity[] = projects
        .filter(project => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return new Date(project.createdAt) > oneWeekAgo;
        })
        .slice(0, 5)
        .map(project => ({
          _id: project._id,
          type: 'PROJECT_CREATED',
          description: `a créé le projet "${project.title}"`,
          userId: {
            name: project.owner.name,
            email: project.owner.email
          },
          createdAt: project.createdAt
        }));

      setRecentActivities(simulatedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleAcceptCollaboration = async (collabId: string) => {
    try {
      const response = await fetch(`/api/collaborations/${collabId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Error accepting collaboration:', error);
      alert('Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  const handleRejectCollaboration = async (collabId: string) => {
    try {
      const response = await fetch(`/api/collaborations/${collabId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Error rejecting collaboration:', error);
      alert('Erreur lors du refus de l\'invitation');
    }
  };

  const confirmDelete = (project: Project) => {
    setDeleteConfirm({ show: true, project });
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirm.project) return;

    try {
      const response = await fetch(`/api/research/${deleteConfirm.project._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        localStorage.setItem('deleteSuccess', 'true');
        localStorage.setItem('deletedProjectTitle', deleteConfirm.project.title);
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(`❌ Échec de la suppression : ${error.message}`);
    } finally {
      setDeleteConfirm({ show: false, project: null });
    }
  };

  // Filtrage des données
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeCollaborations = collaborations.filter(c => c.status === 'ACTIVE');
  const pendingCollaborations = collaborations.filter(c => c.status === 'PENDING');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50 border-green-200';
      case 'DRAFT': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'ARCHIVED': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'COMPLETED': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'ARCHIVED': return 'Archivé';
      case 'COMPLETED': return 'Terminé';
      default: return status;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC': return <FiEye className="w-4 h-4" />;
      case 'PRIVATE': return <FiUsers className="w-4 h-4" />;
      default: return <FiFolder className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'PROJECT_CREATED': return 'bg-green-500';
      case 'FILE_UPLOADED': return 'bg-blue-500';
      case 'COLLABORATOR_ADDED': return 'bg-purple-500';
      case 'COMMENT_ADDED': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-md">
          <div className="w-20 h-20 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiFolder className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Plateforme de Recherche Collaborative</h1>
          <p className="text-slate-600 text-lg">Veuillez vous connecter pour accéder au dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiFolder className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600">Bienvenue, {session.user?.name}!</p>
              </div>
            </div>
            <Link
              href="/projects/new"
              className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-5 h-5" />
              <span>Nouveau Projet</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: FiTrendingUp },
              { id: 'projects', name: 'Projets', icon: FiFolder },
              { id: 'collaborations', name: 'Collaborations', icon: FiUsers }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher des projets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
          
          {activeTab === 'projects' && (
            <div className="flex items-center space-x-4">
              <FiFilter className="w-5 h-5 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actifs</option>
                <option value="DRAFT">Brouillons</option>
                <option value="ARCHIVED">Archivés</option>
                <option value="COMPLETED">Terminés</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-4"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'overview' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 border-l-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Projets Totaux</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalProjects}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FiFolder className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 border-l-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Projets Actifs</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.activeProjects}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <FiActivity className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 border-l-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Collaborations</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalCollaborations}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <FiUsers className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 border-l-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">En Attente</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.pendingInvitations}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <FiClock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="px-6 py-4 border-b border-white/20">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                    <FiAward className="w-5 h-5 text-slate-500" />
                    <span>Projets Récents</span>
                  </h2>
                </div>
                <div className="p-6">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project._id} className="flex items-center justify-between py-3 border-b border-white/20 last:border-0">
                      <div className="flex-1">
                        <Link 
                          href={`/projects/${project._id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {project.title}
                        </Link>
                        <p className="text-sm text-slate-500 truncate">{project.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                        {getVisibilityIcon(project.visibility)}
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Aucun projet</p>
                  )}
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="px-6 py-4 border-b border-white/20">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                    <FiMail className="w-5 h-5 text-slate-500" />
                    <span>Invitations en Attente</span>
                  </h2>
                </div>
                <div className="p-6">
                  {pendingCollaborations.slice(0, 5).map((collab) => (
                    <div key={collab._id} className="py-3 border-b border-white/20 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-900">{collab.project.title}</h4>
                        <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                          {collab.role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        De: {collab.invitedBy.name}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptCollaboration(collab._id)}
                          className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors shadow-sm"
                        >
                          <FiCheck className="w-3 h-3" />
                          <span>Accepter</span>
                        </button>
                        <button
                          onClick={() => handleRejectCollaboration(collab._id)}
                          className="flex items-center space-x-1 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors shadow-sm"
                        >
                          <FiX className="w-3 h-3" />
                          <span>Refuser</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingCollaborations.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Aucune invitation en attente</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <FiClock className="w-5 h-5 text-slate-500" />
                  <span>Activité Récente Détailée</span>
                </h2>
              </div>
              <div className="p-6">
                {recentActivities.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Aucune activité récente</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity._id} className="flex items-start space-x-3 p-3 bg-slate-50/50 rounded-lg">
                        <div className={`w-2 h-2 mt-2 rounded-full ${getActivityColor(activity.type)}`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{activity.description}</p>
                          <p className="text-xs text-slate-500">
                            {activity.userId.name} • {new Date(activity.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'projects' ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Mes Projets ({filteredProjects.length})
                {statusFilter !== 'ALL' && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    • Filtre: {statusFilter === 'ACTIVE' ? 'Actifs' : 
                              statusFilter === 'DRAFT' ? 'Brouillons' :
                              statusFilter === 'ARCHIVED' ? 'Archivés' :
                              statusFilter === 'COMPLETED' ? 'Terminés' : 'Tous'}
                  </span>
                )}
              </h2>
            </div>
            
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center">
                <FiFolder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun projet trouvé</h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Aucun projet ne correspond à vos critères de recherche.' 
                    : 'Commencez par créer votre premier projet.'}
                </p>
                <Link
                  href="/projects/new"
                  className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Créer un Projet</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/20">
                {filteredProjects.map((project) => (
                  <div key={project._id} className="p-6 hover:bg-white/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-linear-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center shrink-0">
                            <FiFolder className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Link 
                                href={`/projects/${project._id}`}
                                className="text-xl font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                              >
                                {project.title}
                              </Link>
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(project.status)}`}>
                                {getStatusLabel(project.status)}
                              </span>
                            </div>
                            <p className="text-slate-600 mb-3">{project.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <span>Créé le {new Date(project.createdAt).toLocaleDateString()}</span>
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {project.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-slate-100 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 3 && (
                                    <span className="text-xs">+{project.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/projects/edit/${project._id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Éditer"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => confirmDelete(project)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="text-lg font-semibold text-slate-900">Mes Collaborations</h2>
            </div>
            
            {collaborations.length === 0 ? (
              <div className="p-12 text-center">
                <FiUsers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune collaboration</h3>
                <p className="text-slate-500">Vous n'avez pas encore de collaborations.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/20">
                {activeCollaborations.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Collaborations Actives ({activeCollaborations.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {activeCollaborations.map((collab) => (
                        <div key={collab._id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FiUsers className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <Link 
                                href={`/projects/${collab.project._id}`}
                                className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                              >
                                {collab.project.title}
                              </Link>
                              <p className="text-sm text-slate-600">
                                Rôle: <span className="font-medium">{collab.role}</span> • 
                                Invité par: {collab.invitedBy.name}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                            ACTIVE
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingCollaborations.length > 0 && (
                  <div className="p-6 bg-amber-50 border-t border-amber-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span>Invitations en Attente ({pendingCollaborations.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {pendingCollaborations.map((collab) => (
                        <div key={collab._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <FiMail className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{collab.project.title}</h4>
                              <p className="text-sm text-slate-600">
                                Rôle: <span className="font-medium">{collab.role}</span> • 
                                De: {collab.invitedBy.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Reçue le {new Date(collab.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptCollaboration(collab._id)}
                              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                            >
                              <FiCheck className="w-4 h-4" />
                              <span>Accepter</span>
                            </button>
                            <button
                              onClick={() => handleRejectCollaboration(collab._id)}
                              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <FiX className="w-4 h-4" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {deleteConfirm.show && deleteConfirm.project && (
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
                "{deleteConfirm.project.title}"
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
                  onClick={() => setDeleteConfirm({ show: false, project: null })}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}