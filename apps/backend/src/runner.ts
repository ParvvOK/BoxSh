import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";

export async function runCode(code: string): Promise<string> {
  const id = randomUUID();
  const filePath = `/tmp/${id}.sh`;
  await writeFile(filePath, code);

  const dockerCmd = `docker run --rm --network none --cpus=0.5 --stop-timeout=10 -v ${filePath}:/script.sh:ro bash:latest bash /script.sh`;

  return new Promise((resolve, reject) => {
    exec(dockerCmd, { timeout: 10000 }, async (error, stdout, stderr) => {
      await unlink(filePath).catch(() => {});
      if (error) {
        if (
          error.killed ||
          error.signal === "SIGTERM" ||
          error.message.includes("timed out")
        ) {
          return resolve(
            "Session timed out: command took longer than 10 seconds"
          );
        }
        return resolve(stderr || error.message);
      }
      resolve(stdout || "No output");
    });
  });
}
