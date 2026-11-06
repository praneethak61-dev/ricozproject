import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  YOUTUBE_API_KEY: requireEnv('YOUTUBE_API_KEY'),
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  TEST_EMAIL: process.env.TEST_EMAIL || 'test@example.com',
  SENDER_NAME: process.env.SENDER_NAME || 'Influencer Agent',
  SENDER_EMAIL: process.env.SENDER_EMAIL || 'noreply@example.com',
  PHYSICAL_ADDRESS: process.env.PHYSICAL_ADDRESS || '123 Main St, City, State, ZIP',
};
