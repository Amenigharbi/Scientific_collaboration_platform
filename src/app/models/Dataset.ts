// app/models/Dataset.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDataset extends Document {
  name: string;
  description: string | null;
  fileType: string;
  license: 'CC_BY' | 'CC_BY_SA' | 'CC_BY_NC' | 'MIT' | 'APACHE_2' | 'PROPRIETARY';
  size: number;
  checksum: string | null;
  
  project: Types.ObjectId;
  currentVersion: Types.ObjectId | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const DatasetSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String 
    },
    fileType: { 
      type: String, 
      required: true 
    },
    license: { 
      type: String, 
      enum: ['CC_BY', 'CC_BY_SA', 'CC_BY_NC', 'MIT', 'APACHE_2', 'PROPRIETARY'],
      default: 'CC_BY'
    },
    size: { 
      type: Number, 
      required: true, 
      default: 0,
      min: [0, 'La taille ne peut pas être négative']
    },
    checksum: { 
      type: String 
    },
    
    project: { 
      type: Schema.Types.ObjectId, 
      ref: 'ResearchProject', 
      required: true 
    },
    currentVersion: { 
      type: Schema.Types.ObjectId, 
      ref: 'DatasetVersion' 
    },
  },
  {
    timestamps: true,
  }
);

DatasetSchema.index({ project: 1, name: 1 }, { unique: true });
DatasetSchema.index({ project: 1, createdAt: -1 });

export default mongoose.models.Dataset || 
       mongoose.model<IDataset>('Dataset', DatasetSchema);