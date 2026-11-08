import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'viewer'],
      default: 'admin',
    },
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
