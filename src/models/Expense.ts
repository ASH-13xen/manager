import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  type: string;
  description?: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Expense;
}

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
