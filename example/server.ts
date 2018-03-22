import * as path from 'path';
import * as ssh from '../dist';

async function main() {
  const server = ssh.createServer((session: ssh.Session) => {
    const { credentials, user } = session;
    console.log('new session!', { credentials, user });

    session.on('shell', (channel: ssh.ShellChannel, extra: ssh.ShellInfo) => {
      console.log('Got a shell!');
    });
  });

  server.useOrCreatePrivateKey(path.join(__dirname, 'keys', 'server'));
  server.authenticate(ssh.auth.password('foobar'));
  
  await server.listen(13722);

  console.log(`Listening on port ${server.address.port}`);
}

main();
