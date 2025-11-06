// app/models/DatasetVersion.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDatasetVersion extends Document {
  version: string;
  checksum: string;
  size: number;
  fileKey: string;
  metadata: any;
  dataset: Types.ObjectId;
  
  createdAt: Date;
}

const DatasetVersionSchema: Schema = new Schema(
  {
    version: { 
      type: String, 
      required: true 
    },
    checksum: { 
      type: String, 
      required: true 
    },
    size: { 
      type: Number, 
      required: true,
      min: [0, 'La taille ne peut pas être négative']
    },
    fileKey: { 
      type: String, 
      required: true 
    },
    metadata: { 
      type: Schema.Types.Mixed 
    },
    
    dataset: { 
      type: Schema.Types.ObjectId, 
      ref: 'Dataset', 
      required: true 
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

DatasetVersionSchema.index({ dataset: 1, version: 1 }, { unique: true });
DatasetVersionSchema.index({ dataset: 1, createdAt: -1 });

export default mongoose.models.DatasetVersion || 
       mongoose.model<IDatasetVersion>('DatasetVersion', DatasetVersionSchema);