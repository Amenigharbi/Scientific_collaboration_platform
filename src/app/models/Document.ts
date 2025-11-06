import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  fileName: string;
  size: number;
  type: string;
  projectId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    size: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


// Vérifier si le modèle existe déjà pour éviter les erreurs de recompilation
export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);