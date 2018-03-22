import * as ssh2 from 'ssh2';

export type AuthenticateResult = boolean | Promise<boolean> | { success: boolean; user: any; } | Promise<{ success: boolean; user: any; }>;

export interface Authenticator {
  method: string;
  authenticate(ctx: ssh2.AuthContext, connection: ssh2.Connection, info: ssh2.ClientInfo): AuthenticateResult;
}
