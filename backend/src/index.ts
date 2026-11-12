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

// Behind Render/Vercel/Railway proxies so req.ip is the real client, not the load balancer
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Rate limiting — each limiter gets its own scope so counters never collide
app.use('/api/auth', rateLimit(20, 60000, 'auth')); // 20 req/min for auth
app.use('/api/discovery', rateLimit(30, 60000, 'discovery')); // 30 req/min for discovery
app.use('/api/', rateLimit(100, 60000, 'api')); // 100 req/min general

// Make sure MongoDB is connected before any route runs. On Vercel a request can
// arrive before the cold-start connection finishes; without this, mongoose
// buffers for 10s and the call fails with a 500 (e.g. "Registration failed").
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next(); // health check must not depend on the DB
  connectDB().then(() => next()).catch(next);
});

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

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Ricoz Backend API',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      brands: '/api/brands',
      discovery: '/api/discovery',
      outreach: '/api/outreach',
      campaigns: '/api/campaigns',
      negotiations: '/api/negotiations',
      deliverables: '/api/deliverables',
      analytics: '/api/analytics',
      export: '/api/export',
      activity: '/api/activity',
      billing: '/api/billing',
      agent: '/api/agent'
    }
  });
});

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

// Start server (local / long-running hosts only).
// On Vercel the app is exported as a single Function, so it must NOT listen.
async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${env.PORT}`);
    console.log(`📊 Features: Multi-platform Discovery | AI Negotiation | Deliverable Tracking | Analytics`);
  });
}

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for Vercel serverless function
export default app;
