const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/rpc',
    createProxyMiddleware({
      target: 'http://localhost:3001/',
      changeOrigin: true,
    })
  );
  app.use(
    '/proxy',
    createProxyMiddleware({
      target: 'http://localhost:3001/',
      changeOrigin: true,
    })
  );
};