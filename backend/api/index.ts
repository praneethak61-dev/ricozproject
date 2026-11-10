import { createServer } from 'http';
import app from '../src/index';

const server = createServer(app);

export default function handler(req: any, res: any) {
  if (req.url.startsWith('/api/')) {
    // Handle API routes
    app(req, res);
  } else {
    // Handle root
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
  }
}
