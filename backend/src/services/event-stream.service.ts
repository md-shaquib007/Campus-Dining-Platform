import { Response } from 'express';
import logger from '../logger';

type Client = { userId: string; res: Response };

const clients = new Map<string, Client>();

export class EventStreamService {
  static subscribe(userId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    const clientId = `${userId}-${Date.now()}`;
    clients.set(clientId, { userId, res });

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    res.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(clientId);
      logger.debug(`SSE client disconnected: ${userId}`);
    });
  }

  static pushToUser(userId: string, event: { type: string; data: unknown }) {
    const payload = `data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`;
    for (const [id, client] of clients) {
      if (client.userId === userId) {
        try {
          client.res.write(payload);
        } catch {
          clients.delete(id);
        }
      }
    }
  }

  static pushToCollege(userIds: string[], event: { type: string; data: unknown }) {
    userIds.forEach((uid) => this.pushToUser(uid, event));
  }
}

export function sseConnect(userId: string, res: Response) {
  EventStreamService.subscribe(userId, res);
}
