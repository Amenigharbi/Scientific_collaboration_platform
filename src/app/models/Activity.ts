// models/Activity.ts - VERSION CORRIGÉE
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  type: 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'FILE_UPLOADED' | 'COLLABORATOR_ADDED' | 'COMMENT_ADDED';
  description: string;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['PROJECT_CREATED', 'PROJECT_UPDATED', 'FILE_UPLOADED', 'COLLABORATOR_ADDED', 'COMMENT_ADDED']
    },
    description: {
      type: String,
      required: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

let Activity;

try {
  Activity = mongoose.models.Activity;
} catch (error) {
  Activity = null;
}

if (!Activity) {
  Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
}

export default Activity;