import { Server } from './server';
import { Session,  } from './session';
import { password, publicKey } from './auth';

export * from './server';
export * from './session';

export const auth = { password, publicKey };

export function createServer(sessionListener: (session: Session) => void): Server {
  return new Server().on('session', sessionListener);
}
