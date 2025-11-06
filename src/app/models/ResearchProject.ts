import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResearchProject extends Document {
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  visibility: 'PRIVATE' | 'PUBLIC' | 'INSTITUTION';
  currentVersion: string;
  tags: string[];
  discipline: string;
  owner: Types.ObjectId;
  forkOf: Types.ObjectId | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const ResearchProjectSchema: Schema = new Schema(
  {
    title: { 
      type: String, 
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [255, 'Le titre ne peut pas dépasser 255 caractères']
    },
    description: { 
      type: String, 
      required: false,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    status: { 
      type: String, 
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'COMPLETED'], 
      default: 'DRAFT' 
    },
    visibility: { 
      type: String, 
      enum: ['PRIVATE', 'PUBLIC', 'INSTITUTION'], 
      default: 'PRIVATE' 
    },
    currentVersion: { 
      type: String, 
      required: true 
    },
    tags: [{ 
      type: String,
      trim: true 
    }],
    discipline: { 
      type: String, 
      required: false 
    },
    
    // Références
    owner: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    forkOf: { 
      type: Schema.Types.ObjectId, 
      ref: 'ResearchProject' 
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les performances
ResearchProjectSchema.index({ owner: 1, createdAt: -1 });
ResearchProjectSchema.index({ status: 1, visibility: 1 });
ResearchProjectSchema.index({ title: 'text', description: 'text', tags: 'text' });
ResearchProjectSchema.index({ owner: 1, title: 1 }, { unique: true });

export default mongoose.models.ResearchProject || 
       mongoose.model<IResearchProject>('ResearchProject', ResearchProjectSchema);