import { createServer } from 'node:http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { resumeDraftTimers, setupSocketHandlers } from '@/src/server/socket';

const isProduction = process.argv.includes('--production');
const runtimeEnv = isProduction ? 'production' : process.env.NODE_ENV ?? 'development';
const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const dev = runtimeEnv !== 'production';

async function main(): Promise<void> {
  const app = next({
    dev,
    hostname,
    port,
  });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    void handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: true,
      credentials: true,
    },
  });

  setupSocketHandlers(io);
  await resumeDraftTimers(io);

  httpServer.listen(port, hostname, () => {
    console.log(
      `> Ready on http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port} (${dev ? 'development' : 'production'})`
    );
  });
}

void main().catch((error) => {
  console.error('Failed to start custom server', error);
  process.exit(1);
});
