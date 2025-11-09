import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  orcid: string;
  institution: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    orcid: {
      type: String,
      unique: true,
      sparse: true,

    },
    institution: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'researcher',
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ orcid: 1 }, { unique: true, sparse: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);