import { Types } from 'mongoose';
import { Activity } from '../models/Activity';

export async function logActivity(entry: {
  userId: string | Types.ObjectId;
  brandId?: string | Types.ObjectId;
  action: string;
  message: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await Activity.create({
      userId: entry.userId,
      brandId: entry.brandId,
      action: entry.action,
      message: entry.message,
      meta: entry.meta || {},
    });
  } catch (error) {
    console.error('Activity log failed:', error);
  }
}
