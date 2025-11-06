// app/types/index.ts
export interface User {
  id: string;
  name: string | null;
  email: string;
  affiliation: string | null;
  expertise: string[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  visibility: Visibility;
  currentVersion: string;
  forkOfId: string | null;
  owner: User;
  datasets: Dataset[];
  collaborators: Collaboration[];
  versions: ProjectVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVersion {
  id: string;
  version: string;
  message: string | null;
  changes: any;
  data: any | null;
  author: User;
  createdAt: Date;
}
export interface DatasetVersion {
  id: string;
  version: string;
  checksum: string;
  size: bigint;
  fileKey: string; // Clé S3
  datasetId: string;
  dataset: Dataset;
  createdAt: Date;
}
export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  fileType: string;
  license: LicenseType;
  size: bigint;
  currentVersion: DatasetVersion | null;
  versions: DatasetVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Collaboration {
  id: string;
  role: CollaborationRole;
  status: CollaborationStatus;
  user: User | null;
  userEmail: string | null;
  invitedBy: User | null;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  RESEARCHER = 'RESEARCHER',
  REVIEWER = 'REVIEWER'
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED'
}

export enum CollaborationRole {
  VIEWER = 'VIEWER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  MAINTAINER = 'MAINTAINER',
  OWNER = 'OWNER'
}

export enum LicenseType {
  CC_BY = 'CC_BY',
  CC_BY_SA = 'CC_BY_SA',
  CC_BY_NC = 'CC_BY_NC',
  MIT = 'MIT',
  APACHE_2 = 'APACHE_2',
  PROPRIETARY = 'PROPRIETARY'
}

export enum Visibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  INSTITUTION = 'INSTITUTION'
}

export enum CollaborationStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE'
}