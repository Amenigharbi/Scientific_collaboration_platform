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
  FiBook,
  FiTrendingUp,
  FiGlobe,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUpload,
  FiSettings,
  FiBell,
  FiShield,
  FiDatabase,
  FiDownload,
  FiTrash2,   
} from 'react-icons/fi';
interface Notification {
  _id: string;
  userId: string;
  type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT' | 'ACTION';
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}
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
interface UserPreferences {
  emailNotifications: boolean;
  projectNotifications: boolean;
  collaborationNotifications: boolean;
  darkMode: boolean;
  publicProfile: boolean;
  activityVisible: boolean;
  defaultProjectVisibility: 'PRIVATE' | 'INSTITUTION' | 'PUBLIC';
  language: string;
  timezone: string;
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
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    specialization: '',
    bio: '',
    website: '',
    location: '',
    orcid: ''
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

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

  interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCollaborations: number;
  pendingInvitations: number;
}

const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
  totalProjects: 0,
  activeProjects: 0,
  totalCollaborations: 0,
  pendingInvitations: 0,
});
const [preferences, setPreferences] = useState({
  emailNotifications: true,
  projectNotifications: true,
  collaborationNotifications: true,
  darkMode: false,
  publicProfile: true,
  activityVisible: true,
  defaultProjectVisibility: 'INSTITUTION' as 'PRIVATE' | 'INSTITUTION' | 'PUBLIC',
  language: 'fr',
  timezone: 'Europe/Paris'
});
const fetchDashboardStats = async () => {
  try {
    const response = await fetch('/api/user/stats');
    if (response.ok) {
      const data = await response.json();
      setDashboardStats(data);
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
};

useEffect(() => {
  if (session?.user?.id) {
    fetchProfile();
    fetchUserProjects();
    fetchDashboardStats(); 
    fetchNotifications();
  }
}, [session]);

const fetchNotifications = async () => {
  setLoadingNotifications(true);
  try {
    const response = await fetch('/api/notifications');
    if (response.ok) {
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } else {
      console.error('Error fetching notifications:', response.status);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  } finally {
    setLoadingNotifications(false);
  }
};

const markAllAsRead = async () => {
  setMarkingAllAsRead(true);
  try {
    const response = await fetch('/api/notifications', {
      method: 'PUT',
    });

    if (response.ok) {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      alert('Toutes les notifications ont été marquées comme lues');
    } else {
      throw new Error('Erreur lors du marquage des notifications');
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    alert('Erreur lors du marquage des notifications');
  } finally {
    setMarkingAllAsRead(false);
  }
};

const markAsRead = async (notificationId: string) => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'PUT',
    });

    if (response.ok) {
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const deleteNotification = async (notificationId: string) => {
  if (confirm('Voulez-vous supprimer cette notification ?')) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
        const notification = notifications.find(n => n._id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
};
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      
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

 const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
const handleSavePreferences = async () => {
  setSavingPreferences(true); 
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (response.ok) {
      alert('Préférences sauvegardées avec succès');
    } else {
      throw new Error('Erreur lors de la sauvegarde des préférences');
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    alert('Erreur lors de la sauvegarde des préférences');
  } finally {
    setSavingPreferences(false); 
  }
};

const handleExportData = async () => {
  if (confirm('Voulez-vous exporter toutes vos données ? Cette opération peut prendre quelques minutes.')) {
    setExportingData(true); 
    try {
      const response = await fetch('/api/user/export-data');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Export de vos données terminé avec succès'); 
      } else {
        throw new Error('Erreur lors de l\'export des données');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setExportingData(false); 
    }
  }
};

const handleDeleteAccount = async () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.')) {
    const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer la suppression de votre compte :');
    if (confirmation === 'SUPPRIMER') {
      setDeletingAccount(true); 
      try {
        const response = await fetch('/api/user/delete-account', {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Votre compte a été supprimé avec succès');
          router.push('/');
        } else {
          throw new Error('Erreur lors de la suppression du compte');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Erreur lors de la suppression du compte');
      } finally {
        setDeletingAccount(false); 
      }
    } else {
      alert('Suppression annulée. Le texte de confirmation ne correspond pas.');
    }
  }
};
const handleAvatarUpload = async (file: File) => {
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    console.log('Uploading avatar...', file.name, file.size);

    const response = await fetch('/api/user/avatar', {
      method: 'POST',
      body: formData,
    });

    console.log('Avatar upload response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Avatar upload successful:', data);
      
      setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null);
      
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.avatarUrl
        }
      });

      alert('Avatar mis à jour avec succès');
    } else {
      const errorData = await response.json();
      console.error('Avatar upload failed:', errorData);
      throw new Error(errorData.error || 'Erreur lors du téléchargement de l\'avatar');
    }
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    alert(error.message || 'Erreur lors du téléchargement de l\'avatar');
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
    console.log('Sending password change request...', {
      hasCurrentPassword: !!passwordData.currentPassword,
      hasNewPassword: !!passwordData.newPassword
    });

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

    console.log('Password change response status:', response.status);
    
    const responseText = await response.text();
    console.log('Password change response text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response from server');
    }

    if (response.ok) {
      console.log('Password change successful');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
      alert('Mot de passe modifié avec succès');
    } else {
      console.error('Password change failed:', responseData);
      throw new Error(responseData.error || `Erreur ${response.status} lors du changement de mot de passe`);
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
          <p className="text-slate-900">Chargement du profil...</p>
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
          <p className="text-slate-900 mb-6">Impossible de charger votre profil.</p>
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

      
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <FiTrendingUp className="w-5 h-5 text-blue-500" />
                <span>Statistiques</span>
                </h3>
            <div className="space-y-3">
            <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-600">Projets créés</span>
                <span className="font-semibold text-slate-900">{dashboardStats.totalProjects}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Projets actifs</span>
                <span className="font-semibold text-slate-900">{dashboardStats.activeProjects}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Collaborations</span>
                <span className="font-semibold text-slate-900">{dashboardStats.totalCollaborations}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Invitations en attente</span>
                <span className="font-semibold text-slate-900">{dashboardStats.pendingInvitations}</span>
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

          <div className="lg:col-span-3 space-y-6">
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

            {activeTab === 'settings' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Paramètres du compte</h2>
      
                <div className="space-y-6">
                 {/* Informations de base */}
                <div className="border border-slate-200 rounded-xl p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <FiUser className="w-5 h-5 text-blue-500" />
                        <span>Informations personnelles</span>
                    </h3>
          
                    {!editing ? (
                        <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                        <p className="text-slate-900 bg-slate-50 rounded-lg p-3">{profile.name}</p>
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <p className="text-slate-900 bg-slate-50 rounded-lg p-3">{profile.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Institution</label>
                            <p className="text-slate-900 bg-slate-50 rounded-lg p-3">{profile.institution}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Spécialisation</label>
                            <p className="text-slate-900 bg-slate-50 rounded-lg p-3">{profile.specialization || 'Non spécifiée'}</p>
                        </div>
                         </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                            <p className="text-slate-900 bg-slate-50 rounded-lg p-3 min-h-20">
                                {profile.bio || 'Aucune biographie renseignée'}
                            </p>
                        </div>
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center space-x-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
                        >
                        <FiEdit3 className="w-5 h-5" />
                        <span>Modifier le profil</span>
                        </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                                placeholder="Votre nom complet"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Institution *</label>
                            <input
                                type="text"
                                value={formData.institution}
                                onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                                placeholder="Votre institution"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Spécialisation</label>
                            <input
                                type="text"
                                value={formData.specialization}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                                placeholder="Votre domaine de spécialisation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">ORCID</label>
                            <input
                                type="text"
                                value={formData.orcid}
                                onChange={(e) => setFormData(prev => ({ ...prev, orcid: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                                placeholder="Votre ID ORCID"
                             />
                        </div>
                        </div>
            
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Site web</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                                placeholder="https://example.com"
                            />
                        </div>
            
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Localisation</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                                placeholder="Ville, Pays"
                             />
                        </div>
            
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">Biographie</label>
                             <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black resize-none"
                                placeholder="Décrivez votre parcours, vos intérêts de recherche..."
                                maxLength={500}
                            />
                            <div className="text-right text-sm text-slate-500 mt-1">
                                {formData.bio?.length || 0}/500 caractères
                            </div>
                        </div>
            
                        <div className="flex space-x-3 pt-2">
                             <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex items-center space-x-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium disabled:opacity-50"
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
            </div>
          </div>
        )}
      </div>

        <div className="border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <FiBell className="w-5 h-5 text-purple-500" />
            <span>Préférences de notification</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Notifications email</p>
                <p className="text-sm text-slate-600">Recevoir des notifications par email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.emailNotifications}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Nouveaux projets</p>
                <p className="text-sm text-slate-600">Notifications pour les nouveaux projets</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.projectNotifications}
                  onChange={(e) => handlePreferenceChange('projectNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Collaborations</p>
                <p className="text-sm text-slate-600">Invitations et demandes de collaboration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.collaborationNotifications}
                  onChange={(e) => handlePreferenceChange('collaborationNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Préférences d'affichage */}
        <div className="border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <FiGlobe className="w-5 h-5 text-green-500" />
            <span>Préférences d'affichage</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Langue</label>
              <select 
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fuseau horaire</label>
              <select 
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Mode sombre</p>
                <p className="text-sm text-slate-600">Activer l'apparence sombre</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.darkMode}
                  onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <FiShield className="w-5 h-5 text-red-500" />
            <span>Confidentialité</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Profil public</p>
                <p className="text-sm text-slate-600">Rendre votre profil visible par d'autres chercheurs</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.publicProfile}
                  onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Activité visible</p>
                <p className="text-sm text-slate-600">Afficher votre activité récente</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.activityVisible}
                  onChange={(e) => handlePreferenceChange('activityVisible', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Visibilité par défaut des nouveaux projets</label>
              <select 
                value={preferences.defaultProjectVisibility}
                onChange={(e) => handlePreferenceChange('defaultProjectVisibility', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
              >
                <option value="PRIVATE">Privé</option>
                <option value="INSTITUTION">Institution seulement</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={savingPreferences}
            className="flex items-center space-x-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50"
          >
            {savingPreferences ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <FiSave className="w-5 h-5" />
            )}
            <span>{savingPreferences ? 'Sauvegarde...' : 'Sauvegarder les préférences'}</span>
          </button>
        </div>

        <div className="border border-red-200 rounded-xl p-6 bg-red-50/50">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center space-x-2">
            <FiDatabase className="w-5 h-5 text-red-500" />
            <span>Actions du compte</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900">Exporter mes données</p>
                <p className="text-sm text-red-700">Télécharger une copie de toutes mes données</p>
              </div>
              <button 
                onClick={handleExportData}
                disabled={exportingData}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {exportingData ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <FiDownload className="w-4 h-4" />
                )}
                <span>{exportingData ? 'Export...' : 'Exporter'}</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900">Supprimer mon compte</p>
                <p className="text-sm text-red-700">Cette action est irréversible</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deletingAccount ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <FiTrash2 className="w-4 h-4" />
                )}
                <span>{deletingAccount ? 'Suppression...' : 'Supprimer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
          {activeTab === 'notifications' && (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
        {unreadCount > 0 && (
          <p className="text-sm text-slate-600 mt-1">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>
      {notifications.length > 0 && unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          disabled={markingAllAsRead}
          className="flex items-center space-x-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50"
        >
          {markingAllAsRead ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <FiBell className="w-4 h-4" />
          )}
          <span>{markingAllAsRead ? 'Marquage...' : 'Tout marquer comme lu'}</span>
        </button>
      )}
    </div>

    {loadingNotifications ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Chargement des notifications...</p>
      </div>
    ) : notifications.length > 0 ? (
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              notification.read
                ? 'bg-slate-50 border-slate-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      notification.read ? 'bg-slate-400' : 'bg-blue-500'
                    }`}
                  ></div>
                  <h3
                    className={`font-medium ${
                      notification.read ? 'text-slate-700' : 'text-slate-900'
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      notification.type === 'INVITATION'
                        ? 'bg-purple-100 text-purple-800'
                        : notification.type === 'MESSAGE'
                        ? 'bg-green-100 text-green-800'
                        : notification.type === 'DOCUMENT'
                        ? 'bg-orange-100 text-orange-800'
                        : notification.type === 'ACTION'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {notification.type === 'INVITATION'
                      ? 'Invitation'
                      : notification.type === 'MESSAGE'
                      ? 'Message'
                      : notification.type === 'DOCUMENT'
                      ? 'Document'
                      : notification.type === 'ACTION'
                      ? 'Action'
                      : 'Système'}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    notification.read ? 'text-slate-600' : 'text-slate-700'
                  }`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    title="Marquer comme lu"
                  >
                    Marquer lu
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Actions spécifiques selon le type de notification */}
            {notification.type === 'INVITATION' && notification.metadata?.projectId && (
              <div className="flex space-x-2 mt-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    console.log('Accepter invitation pour le projet:', notification.metadata.projectId);
                    markAsRead(notification._id);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Accepter
                </button>
                <button
                  onClick={() => {
                    console.log('Refuser invitation pour le projet:', notification.metadata.projectId);
                    markAsRead(notification._id);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <FiBell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune notification</h3>
        <p className="text-slate-600">
          Vous n'avez aucune notification pour le moment.
        </p>
      </div>
    )}
  </div>
           )}
          </div>
        </div>
      </div>
    </div>
  );
}