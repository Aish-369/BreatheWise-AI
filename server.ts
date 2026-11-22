import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './src/server/app';
import { closeDb, getDb, seedDemoHouseholdIfEmpty } from './src/server/db';
import { errorMiddleware } from './src/server/errors';

const PORT = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const db = getDb();
  if (!isProduction) seedDemoHouseholdIfEmpty(db);

  const app = createApp(db, { mountErrorHandler: false });

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.use(errorMiddleware);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`BreatheWise AI server listening on http://0.0.0.0:${PORT}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; closing HTTP server and database.`);
    server.close((error) => {
      try {
        closeDb();
      } catch (closeError) {
        console.error('Database shutdown failed:', closeError);
        process.exitCode = 1;
      }
      if (error) {
        console.error('HTTP server shutdown failed:', error);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer();
