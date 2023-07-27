// modified from https://github.com/prettier/prettier/blob/3.0.0/src/utils/ignore.js

import path from "node:path";
import ignoreModule from "ignore";
import { readFile } from "./read-file.js";
import { normalizeToPosix } from "./utils.js";

const createIgnore = ignoreModule.default;

async function createSingleIsIgnoredFunction(
  ignoreFilePath?: string,
  withNodeModules?: boolean,
): Promise<(filepath: string) => boolean> {
  let content = "";

  if (ignoreFilePath) {
    content += (await readFile(ignoreFilePath)) ?? "";
  }

  if (!withNodeModules) {
    content += "\n" + "node_modules";
  }

  if (!content) {
    return () => false;
  }

  const ignore = createIgnore({ allowRelativePaths: true }).add(content);

  return (filepath) => {
    filepath = path.resolve(filepath);

    // If there's an ignore-path set, the filename must be relative to the
    // ignore path, not the current working directory.
    const relativePath = ignoreFilePath
      ? path.relative(path.dirname(ignoreFilePath), filepath)
      : path.relative(process.cwd(), filepath);

    return ignore.ignores(normalizeToPosix(relativePath));
  };
}

export async function createIsIgnoredFunction(
  ignoreFilePaths: string[],
  withNodeModules?: boolean,
): Promise<(filepath: string) => boolean> {
  // If `ignoreFilePaths` is empty, we still want `withNodeModules` to work
  if (ignoreFilePaths.length === 0 && !withNodeModules) {
    return createSingleIsIgnoredFunction(undefined, withNodeModules);
  }

  const isIgnoredFunctions = await Promise.all(
    ignoreFilePaths.map((ignoreFilePath) =>
      createSingleIsIgnoredFunction(ignoreFilePath, withNodeModules),
    ),
  );

  return (filepath) =>
    isIgnoredFunctions.some((isIgnored) => isIgnored(filepath));
}
