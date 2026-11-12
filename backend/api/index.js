const app = require('../dist/index.js').default;

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
