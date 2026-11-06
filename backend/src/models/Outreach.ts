import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOutreach extends Document {
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'failed';
  followUpCount: number;
  maxFollowUps: number;
  isTestEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachSchema = new Schema<IOutreach>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'failed'],
      default: 'draft',
    },
    followUpCount: {
      type: Number,
      default: 0,
    },
    maxFollowUps: {
      type: Number,
      default: 2,
    },
    isTestEmail: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Outreach = mongoose.model<IOutreach>('Outreach', OutreachSchema);

// Do-Not-Contact list
export interface IDNC extends Document {
  email: string;
  reason: string;
  addedBy: Types.ObjectId;
  createdAt: Date;
}

const DNCSchema = new Schema<IDNC>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    reason: {
      type: String,
      default: 'User requested',
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const DNC = mongoose.model<IDNC>('DNC', DNCSchema);
