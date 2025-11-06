// app/models/Collaboration.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICollaboration extends Document {
  role: 'VIEWER' | 'CONTRIBUTOR' | 'MAINTAINER' | 'OWNER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';
  
  // Références
  project: Types.ObjectId;
  user: Types.ObjectId | null;
  userEmail: string | null;
  invitedBy: Types.ObjectId | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const CollaborationSchema: Schema = new Schema(
  {
    role: { 
      type: String, 
      enum: ['VIEWER', 'CONTRIBUTOR', 'MAINTAINER', 'OWNER'],
      default: 'VIEWER'
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE'],
      default: 'PENDING'
    },
    
    // Références
    project: { 
      type: Schema.Types.ObjectId, 
      ref: 'ResearchProject', 
      required: true 
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    userEmail: { 
      type: String 
    },
    invitedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  {
    timestamps: true,
  }
);

// Index pour l'unicité
CollaborationSchema.index({ project: 1, user: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { user: { $type: "objectId" } }
});

CollaborationSchema.index({ project: 1, userEmail: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { userEmail: { $type: "string" } }
});

// Index pour les requêtes
CollaborationSchema.index({ user: 1, status: 1 });
CollaborationSchema.index({ userEmail: 1, status: 1 });
CollaborationSchema.index({ project: 1, status: 1 });

export default mongoose.models.Collaboration || 
       mongoose.model<ICollaboration>('Collaboration', CollaborationSchema);