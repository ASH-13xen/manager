import mongoose, { Schema, Document } from 'mongoose';

export interface ILog {
  _id?: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: Date;
}

export interface IVersion {
  _id?: string;
  version: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  logs: ILog[];
}

export interface IProject extends Document {
  title: string;
  description?: string;
  type: 'personal' | 'client' | 'hackathon' | 'college' | 'internship';
  imageUrl?: string;
  versions: IVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const LogSchema = new Schema<ILog>({
  text: { type: String, required: true },
  fileUrl: { type: String },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const VersionSchema = new Schema<IVersion>({
  version: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  logs: [LogSchema]
});

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { 
      type: String, 
      enum: ['personal', 'client', 'hackathon', 'college', 'internship'],
      required: true 
    },
    imageUrl: { type: String },
    versions: [VersionSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
