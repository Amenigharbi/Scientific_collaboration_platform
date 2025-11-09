import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    select: false,
  },
  institution: {
    type: String,
    required: [true, 'L\'institution est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom de l\'institution doit contenir au moins 2 caractères'],
    maxlength: [200, 'Le nom de l\'institution ne peut pas dépasser 200 caractères']
  },
  avatar: {
    type: String,
    default: null,
  },
  orcid: {
    type: String,
    trim: true,
    default: '',
    match: [/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, 'Format ORCID invalide']
  },
  specialization: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'La spécialisation ne peut pas dépasser 200 caractères']
  },
  bio: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'La biographie ne peut pas dépasser 1000 caractères']
  },
  website: {
    type: String,
    trim: true,
    default: '',
    match: [/^https?:\/\/.+\..+/, 'URL invalide']
  },
  location: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'La localisation ne peut pas dépasser 100 caractères']
  },
  stats: {
    projectsCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    projectsCollaborated: {
      type: Number,
      default: 0,
      min: 0
    },
    documentsUploaded: {
      type: Number,
      default: 0,
      min: 0
    },
    totalContributions: {
      type: Number,
      default: 0,
      min: 0
    },
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    projectNotifications: { type: Boolean, default: true },
    collaborationNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: true },
    activityVisible: { type: Boolean, default: true },
    defaultProjectVisibility: { 
      type: String, 
      enum: ['PRIVATE', 'INSTITUTION', 'PUBLIC'],
      default: 'INSTITUTION'
    },
    language: { type: String, default: 'fr' },
    timezone: { type: String, default: 'Europe/Paris' }
  }
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);