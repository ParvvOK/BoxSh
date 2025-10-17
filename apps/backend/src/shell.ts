import { exec } from "child_process";

export function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { shell: "/bin/bash" }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
