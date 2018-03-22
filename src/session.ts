import * as ssh2 from 'ssh2';
import { EventEmitter } from 'events';

export type ShellInfo = ssh2.PseudoTtyInfo;
export type ShellChannel = ssh2.ServerChannel;

export interface IShellEventExtra {
  env: {[key: string]: string};
  info: ShellInfo;
}

export interface ISessionEventEmitter {
  addListener(event: 'shell', listener: (channel: ShellChannel, extra: IShellEventExtra) => void): this;
  emit(event: 'shell', channel: ShellChannel, extra: IShellEventExtra): boolean;
  on(event: 'shell', listener: (channel: ShellChannel, extra: IShellEventExtra) => void): this;
  once(event: 'shell', listener: (channel: ShellChannel, extra: IShellEventExtra) => void): this;
  prependListener(event: 'shell', listener: (channel: ShellChannel, extra: IShellEventExtra) => void): this;
  prependOnceListener(event: 'shell', listener: (channel: ShellChannel, extra: IShellEventExtra) => void): this;
  removeListener(event: 'shell', listener: (channel: ShellChannel, extra: IShellEventExtra) => void): this;
}

export interface ICredentials {
  method: string;
  service: string;
  username: string;
}

export class Session extends EventEmitter implements ISessionEventEmitter {
  readonly credentials: Readonly<ICredentials>;
  readonly user?: Readonly<any>;

  readonly connection: ssh2.Connection;
  readonly info: ssh2.ClientInfo;
  readonly session: ssh2.Session;

  constructor(connection: ssh2.Connection, session: ssh2.Session, info: ssh2.ClientInfo, auth: { credentials: ICredentials, user?: any }) {
    super();

    this.credentials = auth.credentials;
    this.user = auth.user;
    this.connection = connection;
    this.info = info;
    this.session = session;

    this.listenForShell();
  }

  private listenForShell() {
    const env: {[key: string]: string} = {};
    let ttyInfo: ssh2.PseudoTtyInfo;

    this.session.on('pty', (accept, reject, info: ssh2.PseudoTtyInfo) => {
      if (this.listenerCount('shell') === 0) { return reject(); }

      ttyInfo = info;
      accept();
    });

    this.session.on('env', (accept, reject, info: ssh2.SetEnvInfo) => {
      env[info.key] = (info as any).val;
    });

    this.session.on('shell', (accept, reject) => {
      if (this.listenerCount('shell') === 0) { return reject(); }

      const channel: ssh2.ServerChannel = accept();
      this.emit('shell', channel, { env, info: ttyInfo });
    });
  }
}
