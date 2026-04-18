import mongoose, { Schema, Document } from 'mongoose';
import { ILog } from './Project'; // Reuse ILog interface

const LogSchema = new Schema<ILog>({
  text: { type: String, required: true },
  fileUrl: { type: String },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export interface ITopic {
  _id?: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  logs: ILog[];
}

export interface IQuestion {
  _id?: string;
  questionText: string;
  tags: string[];
  answerText?: string;
  answerFileUrl?: string;
  answerFileName?: string;
  createdAt: Date;
}

export interface IPreparation extends Document {
  title: string;
  type: 'core cse' | 'skill-based';
  roadmap: ITopic[];
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  logs: [LogSchema]
});

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  tags: [{ type: String }],
  answerText: { type: String },
  answerFileUrl: { type: String },
  answerFileName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const PreparationSchema = new Schema<IPreparation>(
  {
    title: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['core cse', 'skill-based'],
      required: true 
    },
    roadmap: [TopicSchema],
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Preparation; // Ensure Next.js hot reload applies schema changes correctly
}

export default mongoose.models.Preparation || mongoose.model<IPreparation>('Preparation', PreparationSchema);
