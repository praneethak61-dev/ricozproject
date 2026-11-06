import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import brandRoutes from './routes/brand';
import discoveryRoutes from './routes/discovery';
import outreachRoutes from './routes/outreach';
import campaignRoutes from './routes/campaign';
import negotiationRoutes from './routes/negotiation';
import deliverableRoutes from './routes/deliverable';
import analyticsRoutes from './routes/analytics';
import exportRoutes from './routes/export';
import activityRoutes from './routes/activity';
import billingRoutes from './routes/billing';
import agentRoutes from './routes/agent';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
app.use('/api/auth', rateLimit(20, 60000)); // 20 req/min for auth
app.use('/api/discovery', rateLimit(30, 60000)); // 30 req/min for discovery
app.use('/api/', rateLimit(100, 60000)); // 100 req/min general

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/agent', agentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'multi-platform-discovery',
      'ai-scoring',
      'brand-safety',
      'commission-negotiation',
      'deliverable-tracking',
      'analytics',
      'csv-export',
      'activity-log',
      'flat-fee-plan',
    ],
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${env.PORT}`);
    console.log(`📊 Features: Multi-platform Discovery | AI Negotiation | Deliverable Tracking | Analytics`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
