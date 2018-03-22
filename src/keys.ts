import * as path from 'path';
import { execSync } from 'child_process';

export function createKeypair(keyPath: string): void {
  keyPath = path.resolve(keyPath);
  const keyDir = path.dirname(keyPath);
  const keyName = path.basename(keyPath);
  
  execSync(`echo '${keyName}\n\n\n' | ssh-keygen -q -t rsa -b 4096 -N '' > /dev/null`, { cwd: keyDir });
}
