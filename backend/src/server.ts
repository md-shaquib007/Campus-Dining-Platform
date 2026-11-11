import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { env } from './config';
import { prisma } from './config/database';
import logger from './logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/validate.middleware';

const app = express();
const httpServer = createServer(app);

if (!fs.existsSync('logs')) fs.mkdirSync('logs');
if (!fs.existsSync(env.UPLOAD_DIR)) fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: env.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CDIP API',
      version: '2.0.0',
      description: 'Campus Dining Intelligence Platform — Production API',
    },
    servers: [{ url: `http://localhost:${env.port}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get(['/health', '/health/liveness'], (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

app.get('/health/readiness', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Readiness probe failed:', error);
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: error?.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    httpServer.listen(env.port, () => {
      logger.info(`CDIP Server v2.0 running on port ${env.port} [${env.NODE_ENV}]`);
      logger.info(`Swagger: http://localhost:${env.port}/api-docs`);
      logger.info(`SSE stream: GET /api/v1/events/stream`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const handleGracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma database client disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

start();

export default app;
export { httpServer };

