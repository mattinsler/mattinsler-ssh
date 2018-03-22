import * as fs from 'fs';
import * as ssh2 from 'ssh2';
import * as path from 'path';
import { EventEmitter } from 'events';

import { Session } from './session';
import { Authenticator } from './auth';
import { createKeypair } from './keys';

function isPromise<T>(value: any): value is Promise<T> {
  return value && typeof(value.then) === 'function';
}

export class Server extends EventEmitter {
  private authenticators: Authenticator[] = [];
  private privateKeys: Buffer[] = [];
  private server?: ssh2.Server;

  private onConnection = (connection: ssh2.Connection, info: ssh2.ClientInfo) => {
    const auth = {
      credentials: {
        method: '',
        service: '',
        username: '',
      },
      user: undefined,
    };

    connection.on('authentication', async (ctx: ssh2.AuthContext) => {
      for (const authenticator of this.authenticators) {
        if (authenticator.method === ctx.method) {
          let authResult = authenticator.authenticate(ctx, connection, info);
          if (isPromise(authResult)) {
            authResult = await authResult;
          }

          if (typeof(authResult) === 'boolean' ? !authResult : !authResult.success) {
            continue;
          }

          auth.credentials = {
            method: ctx.method,
            service: ctx.service,
            username: ctx.username,
          };

          if (typeof(authResult) !== 'boolean') {
            auth.user = authResult.user;
          }

          return ctx.accept();
        }
      }

      ctx.reject();
    });

    connection.on('ready', () => {
      connection.on('session', (accept, reject) => {
        const session = new Session(connection, accept(), info, auth);
        // do something with sessions?
        this.emit('session', session);
      });
    });

    connection.on('end', () => {
      console.log('Client disconnected');
      // destroy sessions?
    });
  };

  get address() {
    if (!this.server) {
      throw new Error('Server must be listening first to get the address');
    }
    return this.server.address();
  }

  authenticate(fn: Authenticator): this {
    this.authenticators.push(fn);
    return this;
  }
  
  useOrCreatePrivateKey(keyPath: string): this {
    keyPath = path.resolve(keyPath);
    const keyDir = path.dirname(keyPath);

    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir);
    }
    if (!fs.existsSync(keyPath)) {
      createKeypair(keyPath);
    }

    this.privateKeys.push(fs.readFileSync(keyPath));

    return this;
  }

  listen(port: number, address = '0.0.0.0'): Promise<this> {
    if (this.server) {
      throw new Error('Server is already listening');
    }

    this.server = new ssh2.Server({ hostKeys: this.privateKeys });
    this.server.on('connection', this.onConnection);

    return new Promise((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(port, address, () => {
        this.server!.removeListener('error', reject);
        resolve(this);
      });
    });
  }
}
