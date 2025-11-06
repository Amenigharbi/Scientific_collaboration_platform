'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  FiArrowLeft, 
  FiFolderPlus, 
  FiTag, 
  FiGlobe, 
  FiBook,
  FiX,
  FiHelpCircle,
  FiCheck
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

export default function NewProject() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discipline: '',
    tags: [] as string[],
    visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC' | 'INSTITUTION'
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'La description ne peut pas dépasser 1000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const projectId = data.project._id;
        const projectTitle = data.project.title;
        
      
        
        router.push(`/projects/${projectId}?created=true`);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: 'Erreur lors de la création du projet' });
    } finally {
      setLoading(false);
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

  const getVisibilityInfo = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return {
          icon: <FiBook className="w-4 h-4" />,
          title: 'Privé',
          description: 'Seul vous et les collaborateurs invités pouvez voir ce projet',
          color: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'PUBLIC':
        return {
          icon: <FiGlobe className="w-4 h-4" />,
          title: 'Public',
          description: 'Tout le monde peut voir ce projet',
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'INSTITUTION':
        return {
          icon: <FiBook className="w-4 h-4" />,
          title: 'Institution',
          description: 'Visible uniquement par les membres de votre institution',
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      default:
        return {
          icon: <FiBook className="w-4 h-4" />,
          title: 'Privé',
          description: 'Seul vous pouvez voir ce projet',
          color: 'text-red-600 bg-red-50 border-red-200'
        };
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiFolderPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès Requis</h1>
          <p className="text-gray-600">Veuillez vous connecter pour créer un projet</p>
        </div>
      </div>
    );
  }

  const visibilityInfo = getVisibilityInfo(formData.visibility);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiFolderPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouveau Projet de Recherche</h1>
              <p className="text-gray-600">Créez un nouveau projet pour collaborer avec d'autres chercheurs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Détails du Projet</h2>
                <p className="text-gray-600 text-sm mt-1">Remplissez les informations de base de votre projet</p>
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
                      {formData.description.length}/1000
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
                  {formData.tags.length === 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Suggestions :</p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.slice(0, 8).map(tag => (
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

                {/* Erreur de soumission */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.title.trim()}
                    className="px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 font-medium flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-5 h-5" />
                        <span>Créer le Projet</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar d'Aide */}
          <div className="space-y-6">
            {/* Aide Visibilité */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiHelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Visibilité du Projet</h3>
              </div>
              
              <div className="space-y-4">
                {(['PRIVATE', 'PUBLIC', 'INSTITUTION'] as const).map((visibility) => {
                  const info = getVisibilityInfo(visibility);
                  return (
                    <div
                      key={visibility}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.visibility === visibility 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, visibility }))}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${info.color.split(' ')[1]}`}>
                          {info.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{info.title}</span>
                            {formData.visibility === visibility && (
                              <FiCheck className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conseils */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-900 mb-3">💡 Conseils pour un bon projet</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Soyez précis dans le titre</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Décrivez clairement vos objectifs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Utilisez des mots-clés pertinents</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5">•</span>
                  <span>Choisissez la bonne visibilité</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}