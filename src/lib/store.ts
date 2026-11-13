import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Operations } from "./types";

const directory = path.join(process.cwd(), ".data");
const file = path.join(directory, "operations.json");
const state = globalThis as typeof globalThis & {
  teduhQueue?: Promise<unknown>;
};
export async function readOperations(): Promise<Operations> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { inspections: [], reports: [] };
    throw error;
  }
}
export async function mutateOperations<T>(
  update: (data: Operations) => T,
): Promise<T> {
  const job = (state.teduhQueue ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const data = await readOperations();
      const result = update(data);
      await mkdir(directory, { recursive: true });
      const temporary = path.join(
        directory,
        `operations-${crypto.randomUUID()}.tmp`,
      );
      await writeFile(temporary, JSON.stringify(data, null, 2), "utf8");
      await rename(temporary, file);
      return result;
    });
  state.teduhQueue = job;
  return job;
}
