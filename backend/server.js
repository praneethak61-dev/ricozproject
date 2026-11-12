const app = require('./dist/index.js').default;

// Export for Vercel
module.exports = app;

// Also export the app directly
module.exports.default = app;
