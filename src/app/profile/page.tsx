'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiUser,
  FiMail,
  FiAward,
  FiHome,
  FiEdit3,
  FiSave,
  FiX,
  FiCalendar,
  FiBook,
  FiUsers,
  FiTrendingUp,
  FiFileText,
  FiGlobe,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUpload,
  FiSettings,
  FiBell,
  FiShield,
  FiDatabase,
  FiInfo
} from 'react-icons/fi';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  orcid?: string;
  institution: string;
  avatar?: string;
  specialization?: string;
  bio?: string;
  website?: string;
  location?: string;
  joinedAt: string;
  lastActive: string;
  stats: {
    projectsCreated: number;
    projectsCollaborated: number;
    documentsUploaded: number;
    totalContributions: number;
  };
}

interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  visibility: 'PRIVATE' | 'PUBLIC' | 'INSTITUTION';
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    specialization: '',
    bio: '',
    website: '',
    location: '',
    orcid: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchUserProjects();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      console.log('Starting profile fetch...');
      const response = await fetch('/api/user/profile');
      console.log('Profile response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        setProfile(data);
        setFormData({
          name: data.name,
          institution: data.institution,
          specialization: data.specialization || '',
          bio: data.bio || '',
          website: data.website || '',
          location: data.location || '',
          orcid: data.orcid || ''
        });
      } else {
        console.error('Profile fetch failed with status:', response.status);
        const errorText = await response.text();
        console.error('Profile fetch error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async () => {
    try {
      const response = await fetch('/api/user/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log('Saving profile with data:', formData);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Profile update response status:', response.status);
      
      const responseData = await response.json();
      console.log('Profile update response data:', responseData);

      if (response.ok) {
        const updatedProfile = responseData;
        setProfile(updatedProfile);
        setEditing(false);
        
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedProfile.name,
            image: updatedProfile.avatar
          }
        });
        
        console.log('Profile updated successfully');
        alert('Profil mis à jour avec succès');
      } else {
        // Afficher les erreurs de validation détaillées
        let errorMessage = 'Erreur lors de la mise à jour du profil';
        
        if (responseData.details && Array.isArray(responseData.details)) {
          errorMessage = responseData.details.join(', ');
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
        
        console.error('Profile update API error:', responseData);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null);
        
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.avatarUrl
          }
        });
      } else {
        throw new Error('Erreur lors du téléchargement de l\'avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erreur lors du téléchargement de l\'avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowChangePassword(false);
        alert('Mot de passe modifié avec succès');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }
      handleAvatarUpload(file);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-md">
          <div className="w-16 h-16 bg-linear-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Profil non trouvé</h2>
          <p className="text-slate-600 mb-6">Impossible de charger votre profil.</p>
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header du profil */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              <div className="relative">
                <div className="w-24 h-24 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  title="Changer la photo"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <FiUpload className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {profile.name}
                </h1>
                <div className="flex items-center space-x-4 text-slate-500">
                  <div className="flex items-center space-x-1">
                    <FiMail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiHome className="w-4 h-4" />
                    <span>{profile.institution}</span>
                  </div>
                  {profile.orcid && (
                    <div className="flex items-center space-x-1">
                      <FiAward className="w-4 h-4" />
                      <span>{profile.orcid}</span>
                    </div>
                  )}
                </div>
                {profile.specialization && (
                  <p className="text-slate-700 mt-2 font-medium">
                    {profile.specialization}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {!editing ? (
                <>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="flex items-center space-x-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                  >
                    <FiLock className="w-5 h-5" />
                    <span>Mot de passe</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <FiSave className="w-5 h-5" />
                    )}
                    <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: profile.name,
                        institution: profile.institution,
                        specialization: profile.specialization || '',
                        bio: profile.bio || '',
                        website: profile.website || '',
                        location: profile.location || '',
                        orcid: profile.orcid || ''
                      });
                    }}
                    className="flex items-center space-x-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                  >
                    <FiX className="w-5 h-5" />
                    <span>Annuler</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Vue d\'ensemble', icon: FiUser },
                  { id: 'projects', label: 'Mes projets', icon: FiBook },
                  { id: 'settings', label: 'Paramètres', icon: FiSettings },
                  { id: 'security', label: 'Sécurité', icon: FiShield },
                  { id: 'notifications', label: 'Notifications', icon: FiBell },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-700 hover:bg-slate-50/80'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <FiTrendingUp className="w-5 h-5 text-blue-500" />
                <span>Statistiques</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Projets créés</span>
                  <span className="font-semibold text-slate-900">{profile.stats.projectsCreated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Collaborations</span>
                  <span className="font-semibold text-slate-900">{profile.stats.projectsCollaborated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Documents</span>
                  <span className="font-semibold text-slate-900">{profile.stats.documentsUploaded}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Contributions</span>
                  <span className="font-semibold text-slate-900">{profile.stats.totalContributions}</span>
                </div>
              </div>
            </div>

            {/* Informations de compte */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <FiDatabase className="w-5 h-5 text-purple-500" />
                <span>Informations compte</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Membre depuis</span>
                  <span className="text-slate-900">
                    {new Date(profile.joinedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dernière activité</span>
                  <span className="text-slate-900">
                    {new Date(profile.lastActive).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Statut</span>
                  <span className="text-green-600 font-medium">Actif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
             

                {/* Projets récents */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Projets récents</h2>
                  {projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.slice(0, 5).map((project) => (
                        <div key={project._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">{project.title}</h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <span className={`px-2 py-1 rounded-full ${
                                project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {project.status === 'ACTIVE' ? 'Actif' :
                                 project.status === 'COMPLETED' ? 'Terminé' : 'En pause'}
                              </span>
                              <span>Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/projects/${project._id}`)}
                            className="ml-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Voir
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiBook className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Aucun projet pour le moment</p>
                      <button
                        onClick={() => router.push('/projects/create')}
                        className="mt-4 bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                      >
                        Créer un projet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mes projets */}
            {activeTab === 'projects' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Mes projets</h2>
                  <button
                    onClick={() => router.push('/projects/create')}
                    className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    Nouveau projet
                  </button>
                </div>
                
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => (
                      <div key={project._id} className="bg-slate-50 rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-slate-900 text-lg">{project.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {project.status === 'ACTIVE' ? 'Actif' :
                             project.status === 'COMPLETED' ? 'Terminé' : 'En pause'}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                          <span>Visibilité: {project.visibility}</span>
                          <span>Modifié: {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/projects/${project._id}`)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Ouvrir
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiBook className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun projet</h3>
                    <p className="text-slate-600 mb-6">Commencez par créer votre premier projet de recherche</p>
                    <button
                      onClick={() => router.push('/projects/create')}
                      className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                      Créer un projet
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sécurité */}
            {activeTab === 'security' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Sécurité du compte</h2>
                
                <div className="space-y-6">
                  {/* Changement de mot de passe */}
                  <div className="border border-slate-200 rounded-xl p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <FiLock className="w-5 h-5 text-blue-500" />
                      <span>Mot de passe</span>
                    </h3>
                    
                    {!showChangePassword ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600">Votre mot de passe a été défini le</p>
                          <p className="text-sm text-slate-500">
                            {new Date(profile.joinedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
                        >
                          Changer
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mot de passe actuel
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12 text-black placeholder-gray-500"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('current')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nouveau mot de passe
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12 text-black placeholder-gray-500"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPasswords.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Confirmer le nouveau mot de passe
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12 text-black placeholder-gray-500"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPasswords.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 pt-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="bg-linear-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium disabled:opacity-50"
                          >
                            {saving ? 'Changement...' : 'Mettre à jour'}
                          </button>
                          <button
                            onClick={() => {
                              setShowChangePassword(false);
                              setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                            }}
                            className="border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Session active */}
                  <div className="border border-slate-200 rounded-xl p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <FiUser className="w-5 h-5 text-green-500" />
                      <span>Session active</span>
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600">Session commencée le</p>
                        <p className="text-sm text-slate-500">
                          {new Date().toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}