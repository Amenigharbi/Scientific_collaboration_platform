import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResearchProject extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  visibility: 'PRIVATE' | 'PUBLIC' | 'INSTITUTION';
  tags: string[];
  discipline?: string;
  currentVersion: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchProjectSchema = new Schema<IResearchProject>(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [255, 'Le titre ne peut pas dépasser 255 caractères']
    },
    description: {
      type: String,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'PUBLIC', 'INSTITUTION'],
      default: 'PRIVATE'
    },
    tags: [{
      type: String,
      trim: true
    }],
    discipline: {
      type: String,
      trim: true
    },
    currentVersion: {
      type: String,
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

ResearchProjectSchema.index({ owner: 1, createdAt: -1 });
ResearchProjectSchema.index({ visibility: 1 });
ResearchProjectSchema.index({ status: 1 });
ResearchProjectSchema.index({ tags: 1 });

export default mongoose.models.ResearchProject || 
  mongoose.model<IResearchProject>('ResearchProject', ResearchProjectSchema);