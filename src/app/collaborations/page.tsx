// app/collaborations/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface Collaboration {
  _id: string;
  role: string;
  status: string;
  userEmail: string;
  project: {
    _id: string;
    title: string;
    description: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function CollaborationsPage() {
  const { data: session } = useSession();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    fetchCollaborations();
  }, [activeTab]);

  const fetchCollaborations = async () => {
    try {
      const response = await fetch(`/api/collaborations?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setCollaborations(data.collaborations || []);
      }
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (collabId: string) => {
    // À implémenter
    console.log('Accepter collaboration:', collabId);
  };

  const handleReject = async (collabId: string) => {
    // À implémenter
    console.log('Refuser collaboration:', collabId);
  };

  if (!session) {
    return <div>Veuillez vous connecter</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Collaborations</h1>
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Invitations reçues
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Invitations envoyées
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="animate-pulse">Chargement...</div>
        ) : collaborations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === 'received' 
                ? 'Aucune invitation reçue' 
                : 'Aucune invitation envoyée'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {collaborations.map((collab) => (
              <div key={collab._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {collab.project.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{collab.project.description}</p>
                    
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-500">
                        <strong>Rôle:</strong> {collab.role}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Statut:</strong> 
                        <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                          collab.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : collab.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {collab.status}
                        </span>
                      </p>
                      {activeTab === 'received' && (
                        <p className="text-sm text-gray-500">
                          <strong>Invitation de:</strong> {collab.invitedBy.name} ({collab.invitedBy.email})
                        </p>
                      )}
                      {activeTab === 'sent' && (
                        <p className="text-sm text-gray-500">
                          <strong>Invitation à:</strong> {collab.userEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {activeTab === 'received' && collab.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAccept(collab._id)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleReject(collab._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}