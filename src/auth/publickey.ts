import * as fs from 'fs';
import * as util from 'util';
import * as ssh2 from 'ssh2';
import * as crypto from 'crypto';
const buffersEqual = require('buffer-equal-constant-time');

import { Authenticator } from './types';

export function publicKey(
  authorizedKeyFilename: string,
  resolveUser?: (ctx: ssh2.PublicKeyAuthContext, connection: ssh2.Connection, info: ssh2.ClientInfo) => Promise<any>
): Authenticator {
  const keyData = fs.readFileSync(authorizedKeyFilename);
  const parsedKey = ssh2.utils.parseKey(keyData);
  if (util.isError(parsedKey)) {
    throw parsedKey;
  }
  const publicKey = ssh2.utils.genPublicKey(parsedKey);

  return {
    method: 'publickey',
    authenticate(ctx: ssh2.PublicKeyAuthContext, connection: ssh2.Connection, info: ssh2.ClientInfo) {
      const _authenticate = () => {
        const { blob, key, sigAlgo, signature } = ctx;

        if (key.algo === publicKey.fulltype && buffersEqual(key.data, publicKey.public)) {
          if (!signature) { return true; }
    
          const verifier = crypto.createVerify(sigAlgo);
          verifier.update(blob);
    
          return verifier.verify(publicKey.publicOrig, signature);
        }

        return false;
      };

      if (!_authenticate()) { return false; }
      if (!resolveUser) { return true; }

      const user = resolveUser(ctx, connection, info);
      if (!!user && typeof(user.then) === 'function') {
        return user.then(user => ({
          success: true,
          user,
        }));
      } 

      return {
        success: true,
        user,
      };
    },
  };
}
