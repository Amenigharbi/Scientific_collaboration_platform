import { MongoClient, ObjectId } from 'mongodb';

export interface Activity {
  _id: string;
  type: 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'COLLABORATOR_ADDED' | 'FILE_UPLOADED' | 'COMMENT_ADDED';
  description: string;
  user: {
    name: string;
    email: string;
  };
  projectId: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('scientific-collab');
const activitiesCollection = db.collection<Omit<Activity, '_id'> & { _id: ObjectId }>('activities');

export async function fetchActivitiesFromDB(projectId: string): Promise<Activity[]> {
  try {
    await client.connect();
    
    const activities = await activitiesCollection
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return activities.map(activity => ({
      ...activity,
      _id: activity._id.toString(),
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString()
    })) as any;
  } catch (error) {
    console.error('Error fetching activities from DB:', error);
    throw new Error('Erreur lors de la récupération des activités');
  } finally {
    await client.close();
  }
}

export async function createActivityInDB(activityData: {
  projectId: string;
  type: Activity['type'];
  description: string;
  user: {
    name: string | null | undefined; // ✅ CORRIGÉ : ajouter undefined
    email: string | null | undefined; // ✅ CORRIGÉ : ajouter undefined
  };
  metadata?: any;
}): Promise<Activity> {
  try {
    await client.connect();
    
    const userName = activityData.user.name || 'Utilisateur inconnu';
    const userEmail = activityData.user.email || 'unknown@example.com';

    const newActivity = {
      ...activityData,
      user: {
        name: userName,
        email: userEmail
      },
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await activitiesCollection.insertOne(newActivity as any);
    
    return {
      ...newActivity,
      _id: result.insertedId.toString(),
      createdAt: newActivity.createdAt.toISOString(),
      updatedAt: newActivity.updatedAt.toISOString()
    } as any;
  } catch (error) {
    console.error('Error creating activity in DB:', error);
    throw new Error('Erreur lors de la création de l\'activité');
  } finally {
    await client.close();
  }
}

// ✅ CORRECTION : Mettre à jour les types des helpers
export const ActivityHelpers = {
  async projectCreated(
    projectId: string, 
    user: { name: string | null | undefined; email: string | null | undefined }, // ✅ Ajouter undefined
    projectName: string
  ) {
    return await createActivityInDB({
      projectId,
      type: 'PROJECT_CREATED',
      description: `Projet "${projectName}" créé`,
      user,
      metadata: { projectName }
    });
  },

  async projectUpdated(
    projectId: string, 
    user: { name: string | null | undefined; email: string | null | undefined }, // ✅ Ajouter undefined
    field: string
  ) {
    return await createActivityInDB({
      projectId,
      type: 'PROJECT_UPDATED',
      description: `Champ "${field}" du projet modifié`,
      user,
      metadata: { field }
    });
  },

  async collaboratorAdded(
    projectId: string, 
    user: { name: string | null | undefined; email: string | null | undefined }, // ✅ Ajouter undefined
    collaboratorName: string
  ) {
    return await createActivityInDB({
      projectId,
      type: 'COLLABORATOR_ADDED',
      description: `Collaborateur "${collaboratorName}" ajouté au projet`,
      user,
      metadata: { collaboratorName }
    });
  },

  async fileUploaded(
    projectId: string, 
    user: { name: string | null | undefined; email: string | null | undefined }, // ✅ Ajouter undefined
    fileName: string
  ) {
    return await createActivityInDB({
      projectId,
      type: 'FILE_UPLOADED',
      description: `Fichier "${fileName}" uploadé`,
      user,
      metadata: { fileName }
    });
  },

  async commentAdded(
    projectId: string, 
    user: { name: string | null | undefined; email: string | null | undefined }, // ✅ Ajouter undefined
    target: string
  ) {
    return await createActivityInDB({
      projectId,
      type: 'COMMENT_ADDED',
      description: `Commentaire ajouté sur "${target}"`,
      user,
      metadata: { target }
    });
  }
};