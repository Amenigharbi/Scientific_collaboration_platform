'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { FiUpload, FiFile, FiDownload, FiTrash2, FiFolder, FiImage, FiFileText, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';

interface ProjectFile {
  _id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  url: string;
}

interface DocumentManagerProps {
  projectId: string;
  isOwner: boolean;
}

export default function DocumentManager({ projectId, isOwner }: DocumentManagerProps) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<ProjectFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { emitAction } = useNotifications();
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; document: ProjectFile | null }>({
    show: false,
    document: null
  });

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/project/${projectId}`);
      console.log('📁 Fetch documents response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Documents fetched:', data.documents);
        setDocuments(data.documents || []);
      } else {
        const error = await response.json();
        console.error('❌ Error fetching documents:', error);
      }
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('projectId', projectId);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newDocument = await response.json();
        console.log('✅ Document uploaded:', newDocument);
        setDocuments(prev => [newDocument, ...prev]);
        event.target.value = '';
        alert(`✅ "${newDocument.name}" a été uploadé avec succès !`);
        
        // Émettre une action SSE
        emitAction({
          type: 'document_uploaded',
          title: 'Document téléversé',
          message: `Le document "${newDocument.name}" a été téléversé avec succès`,
          metadata: {
            documentId: newDocument._id,
            documentName: newDocument.name,
            projectId: projectId,
            uploadedBy: session?.user?.name || 'Utilisateur'
          }
        });
        
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('❌ Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = (document: ProjectFile) => {
    setDeleteConfirm({ show: true, document });
  };

  const handleDeleteDocument = async () => {
    if (!deleteConfirm.document) return;

    const documentId = deleteConfirm.document._id;
    const documentName = deleteConfirm.document.name;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        console.log('🗑️ Document deleted:', documentId);
        
        alert(`🗑️ "${documentName}" a été supprimé avec succès.`);
        
        // Émettre une action SSE
        emitAction({
          type: 'document_deleted',
          title: 'Document supprimé',
          message: `Le document "${documentName}" a été supprimé`,
          metadata: {
            documentId: documentId,
            documentName: documentName,
            projectId: projectId,
            deletedBy: session?.user?.name || 'Utilisateur'
          }
        });
        
      } else {
        const error = await response.json();
        alert(`❌ Erreur lors de la suppression: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('❌ Erreur lors de la suppression');
    } finally {
      setDeleteConfirm({ show: false, document: null });
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      console.log('📥 Starting download for:', file.name);
      console.log('🔗 File URL:', file.url);
      
      const downloadUrl = `${window.location.origin}${file.url}`;
      console.log('🌐 Full download URL:', downloadUrl);
      
      const testResponse = await fetch(downloadUrl);
      console.log('🧪 Test response status:', testResponse.status);
      
      if (!testResponse.ok) {
        throw new Error(`Fichier non accessible (${testResponse.status})`);
      }
      
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.style.display = 'none';
      
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      console.log('✅ Download initiated successfully');
      
      alert(`📥 Téléchargement de "${file.name}" commencé !`);
      
      // Émettre une action SSE
      emitAction({
        type: 'document_downloaded',
        title: 'Document téléchargé',
        message: `Le document "${file.name}" a été téléchargé`,
        metadata: {
          documentId: file._id,
          documentName: file.name,
          projectId: projectId,
          downloadedBy: session?.user?.name || 'Utilisateur'
        }
      });
      
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert(`❌ Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FiImage className="w-6 h-6 text-blue-500" />;
    if (type.includes('pdf')) return <FiFileText className="w-6 h-6 text-red-500" />;
    if (type.includes('word')) return <FiFileText className="w-6 h-6 text-blue-600" />;
    return <FiFile className="w-6 h-6 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <FiFolder className="w-6 h-6 text-blue-500" />
            <span>Documents du projet ({documents.length})</span>
          </h3>
          
          {isOwner && (
            <label className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <FiUpload className="w-4 h-4" />
              <span>{isUploading ? 'Upload...' : 'Uploader'}</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
            </label>
          )}
        </div>

        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">Upload en cours...</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FiFile className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Aucun document uploadé</p>
              {isOwner && (
                <p className="text-sm mt-2">Utilisez le bouton "Uploader" pour ajouter des documents</p>
              )}
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{doc.name}</h4>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-slate-400">
                      Uploadé par {doc.uploadedBy.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                  {isOwner && (
                    <button 
                      onClick={() => confirmDelete(doc)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.show && deleteConfirm.document && (
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
                Vous êtes sur le point de supprimer le document :
              </p>
              
              <p className="font-semibold text-slate-900 mb-4 text-lg bg-rose-50 py-2 px-4 rounded-lg border border-rose-200">
                "{deleteConfirm.document.name}"
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2 text-amber-800">
                  <FiInfo className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Cette action est irréversible</p>
                    <p className="text-xs mt-1">
                      Le fichier sera définitivement supprimé du serveur et de la base de données.
                      Cette action ne peut pas être annulée.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, document: null })}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteDocument}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}