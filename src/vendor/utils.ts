// modified from https://github.com/prettier/prettier/blob/3.0.0/src/cli/utils.js

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Get stats of a given path without following symbolic links.
 */
export async function lstatSafe(filePath: string) {
  try {
    return await fs.lstat(filePath);
  } catch (error: any) {
    /* c8 ignore next 3 */
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Replace `\` with `/` on Windows
 */
export const normalizeToPosix: (filepath: string) => string =
  path.sep === "\\"
    ? (filepath) => filepath.replaceAll("\\", "/")
    : (filepath) => filepath;
