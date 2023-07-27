// modified from https://github.com/prettier/prettier/blob/3.0.0/src/utils/read-file.js

import fs from "node:fs/promises";

export async function readFile(filename: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filename, "utf8");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return;
    }

    throw new Error(`Unable to read '${filename}': ${error.message}`);
  }
}
