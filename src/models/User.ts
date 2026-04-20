import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  expenseTypes: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    expenseTypes: { type: [String], default: ['Food/Groceries', 'Accessories', 'Birthdays'] },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
