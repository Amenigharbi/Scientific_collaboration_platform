// app/models/ProjectVersion.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectVersion extends Document {
  version: string;
  message: string | null;
  changes: any;
  data: any | null;
  
  // Références
  project: Types.ObjectId;
  author: Types.ObjectId;
  
  createdAt: Date;
}

const ProjectVersionSchema: Schema = new Schema(
  {
    version: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String 
    },
    changes: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    data: { 
      type: Schema.Types.Mixed 
    },
    
    // Références
    project: { 
      type: Schema.Types.ObjectId, 
      ref: 'ResearchProject', 
      required: true 
    },
    author: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ProjectVersionSchema.index({ project: 1, createdAt: -1 });
ProjectVersionSchema.index({ project: 1, version: 1 }, { unique: true });
ProjectVersionSchema.index({ author: 1, createdAt: -1 });

export default mongoose.models.ProjectVersion || 
       mongoose.model<IProjectVersion>('ProjectVersion', ProjectVersionSchema);