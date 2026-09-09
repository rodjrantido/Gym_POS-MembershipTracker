import authHandler from './auth.js';
import membersHandler from './members.js';
import inventoryHandler from './inventory.js';
import daypassersHandler from './daypassers.js';
import transactionsHandler from './transactions.js';

const routes = {
  '/api/auth': authHandler,
  '/api/members': membersHandler,
  '/api/inventory': inventoryHandler,
  '/api/daypassers': daypassersHandler,
  '/api/transactions': transactionsHandler,
};

export function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        const handler = routes[pathname];
        if (!handler) {
          return next();
        }

        // Attach query params to req.query
        req.query = Object.fromEntries(parsedUrl.searchParams.entries());

        // Polyfill res.status and res.json for Express/Vercel compatibility
        res.status = function (code) {
          res.statusCode = code;
          return res;
        };

        res.json = function (data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        // Parse body if POST/PUT/PATCH/DELETE
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
            } catch {
              req.body = {};
            }
            try {
              await handler(req, res);
            } catch (err) {
              console.error('[API Dev Error]', err);
              if (!res.writableEnded) {
                res.status(500).json({ error: err.message || 'Internal Dev Server Error' });
              }
            }
          });
        } else {
          try {
            await handler(req, res);
          } catch (err) {
            console.error('[API Dev Error]', err);
            if (!res.writableEnded) {
              res.status(500).json({ error: err.message || 'Internal Dev Server Error' });
            }
          }
        }
      });
    },
  };
}

