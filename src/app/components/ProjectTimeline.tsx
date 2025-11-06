'use client';
import { useState, useEffect } from 'react';
import { FiClock, FiUserPlus, FiEdit3, FiMessageSquare, FiFile } from 'react-icons/fi';

interface Activity {
  _id: string;
  type: 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'COLLABORATOR_ADDED' | 'FILE_UPLOADED' | 'COMMENT_ADDED';
  description: string;
  user: {
    name: string;
    email: string;
  };
  metadata?: any;
  createdAt: string;
}

interface ProjectTimelineProps {
  projectId: string;
}

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_CREATED':
        return <FiClock className="w-4 h-4 text-green-500" />;
      case 'PROJECT_UPDATED':
        return <FiEdit3 className="w-4 h-4 text-blue-500" />;
      case 'COLLABORATOR_ADDED':
        return <FiUserPlus className="w-4 h-4 text-purple-500" />;
      case 'FILE_UPLOADED':
        return <FiFile className="w-4 h-4 text-orange-500" />;
      case 'COMMENT_ADDED':
        return <FiMessageSquare className="w-4 h-4 text-cyan-500" />;
      default:
        return <FiClock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'PROJECT_CREATED':
        return 'bg-green-100 border-green-200';
      case 'PROJECT_UPDATED':
        return 'bg-blue-100 border-blue-200';
      case 'COLLABORATOR_ADDED':
        return 'bg-purple-100 border-purple-200';
      case 'FILE_UPLOADED':
        return 'bg-orange-100 border-orange-200';
      case 'COMMENT_ADDED':
        return 'bg-cyan-100 border-cyan-200';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2">
        <FiClock className="w-6 h-6 text-slate-500" />
        <span>Activité récente</span>
      </h3>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Aucune activité récente</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity._id}
              className={`flex items-start space-x-4 p-4 rounded-xl border ${getActivityColor(activity.type)}`}
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1">
                <p className="text-slate-900">{activity.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                  <span>Par {activity.user.name}</span>
                  <span>•</span>
                  <span>
                    {new Date(activity.createdAt).toLocaleDateString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}