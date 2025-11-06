'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  FiArrowLeft, 
  FiSave, 
  FiX, 
  FiTag,
  FiEye,
  FiActivity,
  FiBook,
  FiAward,
  FiLoader
} from 'react-icons/fi';

const DISCIPLINES = [
  'Informatique',
  'Biologie',
  'Physique',
  'Chimie',
  'Mathématiques',
  'Médecine',
  'Génie Civil',
  'Électronique',
  'Robotique',
  'Data Science',
  'Intelligence Artificielle',
  'Neurosciences',
  'Écologie',
  'Astronomie',
  'Autre'
];

const SUGGESTED_TAGS = [
  'Recherche', 'IA', 'Machine Learning', 'Analyse Données',
  'Expérimentation', 'Simulation', 'Modélisation', 'Algorithmes',
  'Bioinformatique', 'Génomique', 'Environnement', 'Santé',
  'Énergie', 'Développement Durable', 'Innovation'
];

interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  visibility: 'PRIVATE' | 'PUBLIC' | 'INSTITUTION';
  tags: string[];
  discipline: string;
}

export default function EditProject() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Project>({
    _id: '',
    title: '',
    description: '',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    tags: [],
    discipline: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/research/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        console.error('Error fetching project');
        setErrors({ fetch: 'Erreur lors du chargement du projet' });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setErrors({ fetch: 'Erreur de connexion' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'La description ne peut pas dépasser 2000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/research/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          visibility: formData.visibility,
          tags: formData.tags,
          discipline: formData.discipline
        }),
      });

      if (response.ok) {
        router.push(`/projects/${params.id}?updated=true`);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setErrors({ submit: 'Erreur lors de la mise à jour du projet' });
    } finally {
      setSaving(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { color: 'bg-gray-100 text-gray-800', label: 'Brouillon', icon: FiBook };
      case 'ACTIVE':
        return { color: 'bg-green-100 text-green-800', label: 'Actif', icon: FiActivity };
      case 'COMPLETED':
        return { color: 'bg-blue-100 text-blue-800', label: 'Terminé', icon: FiAward };
      case 'ARCHIVED':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Archivé', icon: FiSave };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: FiBook };
    }
  };

  const getVisibilityInfo = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return { 
          color: 'bg-red-100 text-red-800', 
          label: 'Privé', 
          icon: FiEye,
          description: 'Seul vous et les collaborateurs'
        };
      case 'PUBLIC':
        return { 
          color: 'bg-green-100 text-green-800', 
          label: 'Public', 
          icon: FiEye,
          description: 'Visible par tout le monde'
        };
      case 'INSTITUTION':
        return { 
          color: 'bg-blue-100 text-blue-800', 
          label: 'Institution', 
          icon: FiEye,
          description: 'Membres de votre institution'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          label: visibility, 
          icon: FiEye,
          description: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(formData.status);
  const visibilityInfo = getVisibilityInfo(formData.visibility);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/projects/${params.id}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors p-2 rounded-lg hover:bg-white/50"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Retour au projet</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiSave className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Éditer le Projet</h1>
              <p className="text-gray-600">Modifiez les informations de votre projet de recherche</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Informations du Projet</h2>
                <p className="text-gray-600 text-sm mt-1">Modifiez les détails de votre projet</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Titre */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du projet *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, title: e.target.value }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Analyse des séquences génomiques par IA..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <span className="text-xs text-gray-500">
                      {formData.description.length}/2000
                    </span>
                  </div>
                  <textarea
                    id="description"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }));
                      if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-black ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Décrivez les objectifs, la méthodologie et l'importance de votre recherche..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Discipline */}
                <div>
                  <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-2">
                    Discipline principale
                  </label>
                  <select
                    id="discipline"
                    value={formData.discipline}
                    onChange={(e) => setFormData(prev => ({ ...prev, discipline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                  >
                    <option value="">Sélectionnez une discipline</option>
                    {DISCIPLINES.map(discipline => (
                      <option key={discipline} value={discipline}>{discipline}</option>
                    ))}
                  </select>
                </div>

                {/* Statut et Visibilité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Statut */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Statut du projet
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    >
                      <option value="DRAFT">Brouillon</option>
                      <option value="ACTIVE">Actif</option>
                      <option value="COMPLETED">Terminé</option>
                      <option value="ARCHIVED">Archivé</option>
                    </select>
                  </div>

                  {/* Visibilité */}
                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                      Visibilité
                    </label>
                    <select
                      id="visibility"
                      value={formData.visibility}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    >
                      <option value="PRIVATE">Privé</option>
                      <option value="PUBLIC">Public</option>
                      <option value="INSTITUTION">Institution</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Mots-clés
                    </label>
                    <span className="text-xs text-black">
                      {formData.tags.length}/10 tags
                    </span>
                  </div>
                  
                  {/* Input Tags */}
                  <div className="relative">
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInput}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                      placeholder="Tapez un mot-clé et appuyez sur Entrée..."
                    />
                    <FiTag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>

                  {/* Tags suggérés */}
                  {formData.tags.length < 5 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Suggestions :</p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.slice(0, 6).map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addSuggestedTag(tag)}
                            className="px-3 py-1 text-sm bg-gray-100 text-black rounded-full hover:bg-gray-200 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags sélectionnés */}
                  {formData.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(index)}
                              className="hover:text-blue-900 transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Erreurs */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                )}

                {errors.fetch && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700 text-sm">{errors.fetch}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/${params.id}`)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.title.trim()}
                    className="px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 font-medium flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Sauvegarde...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" />
                        <span>Sauvegarder les modifications</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar d'Aide */}
          <div className="space-y-6">
            {/* Aperçu Statut */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Aperçu du Statut</h3>
              <div className="space-y-3">
                <div className={`p-3 border rounded-lg ${statusInfo.color} border-current`}>
                  <div className="flex items-center space-x-2">
                    <statusInfo.icon className="w-4 h-4" />
                    <span className="font-medium">{statusInfo.label}</span>
                  </div>
                </div>
                <div className={`p-3 border rounded-lg ${visibilityInfo.color} border-current`}>
                  <div className="flex items-center space-x-2">
                    <visibilityInfo.icon className="w-4 h-4" />
                    <span className="font-medium">{visibilityInfo.label}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-75">{visibilityInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-900 mb-3">💡 Conseils de modification</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Mettez à jour le statut selon l'avancement</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Ajoutez des mots-clés pertinents</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Vérifiez la visibilité appropriée</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Une description claire aide les collaborateurs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}