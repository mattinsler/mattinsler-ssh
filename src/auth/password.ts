import * as ssh2 from 'ssh2';

import { AuthenticateResult, Authenticator } from './types';

export function password(acceptor: (ctx: ssh2.PasswordAuthContext, connection: ssh2.Connection, info: ssh2.ClientInfo) => AuthenticateResult): Authenticator {
  return {
    method: 'password',
    authenticate(ctx: ssh2.PasswordAuthContext, connection, info) {
      return acceptor(ctx, connection, info);
    },
  };
}
