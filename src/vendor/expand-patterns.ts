// modified from https://github.com/prettier/prettier/blob/3.0.0/src/cli/expand-patterns.js

import path from "node:path";
import fastGlob from "fast-glob";
import { lstatSafe, normalizeToPosix } from "./utils.js";
import { Context } from "./context.js";

export async function* expandPatterns(context: Context) {
  const seen = new Set();
  let noResults = true;

  for await (const pathOrError of expandPatternsInternal(context)) {
    noResults = false;
    if (typeof pathOrError !== "string") {
      yield pathOrError;
      continue;
    }

    const fileName = path.resolve(pathOrError);

    // filter out duplicates
    if (seen.has(fileName)) {
      continue;
    }

    seen.add(fileName);
    yield fileName;
  }
}

async function* expandPatternsInternal(context: Context) {
  // Ignores files in version control systems directories and `node_modules`
  const silentlyIgnoredDirs = [".git", ".sl", ".svn", ".hg"];
  if (context.argv.withNodeModules !== true) {
    silentlyIgnoredDirs.push("node_modules");
  }
  const globOptions = {
    dot: true,
    ignore: silentlyIgnoredDirs.map((dir) => "**/" + dir),
    followSymbolicLinks: false,
  };

  let supportedFilesGlob: string | undefined;
  const cwd = process.cwd();

  const entries: Array<{
    type: "file" | "dir" | "glob";
    glob: string;
    input: string;
  }> = [];

  for (const pattern of context.argv.filePatterns) {
    const absolutePath = path.resolve(cwd, pattern);

    if (containsIgnoredPathSegment(absolutePath, cwd, silentlyIgnoredDirs)) {
      continue;
    }

    const stat = await lstatSafe(absolutePath);
    if (stat) {
      if (stat.isSymbolicLink()) {
        yield {
          error: `Explicitly specified pattern "${pattern}" is a symbolic link.`,
        };
      } else if (stat.isFile()) {
        entries.push({
          type: "file",
          glob: escapePathForGlob(normalizeToPosix(pattern)),
          input: pattern,
        });
      } else if (stat.isDirectory()) {
        /*
        1. Remove trailing `/`, `fast-glob` can't find files for `src//*.js` pattern
        2. Cleanup dirname, when glob `src/../*.js` pattern with `fast-glob`,
          it returns files like 'src/../index.js'
        */
        const relativePath = path.relative(cwd, absolutePath) || ".";
        entries.push({
          type: "dir",
          glob:
            escapePathForGlob(normalizeToPosix(relativePath)) +
            "/" +
            getSupportedFilesGlob(),
          input: pattern,
        });
      }
    } else if (pattern[0] === "!") {
      // convert negative patterns to `ignore` entries
      globOptions.ignore.push(normalizeToPosix(pattern.slice(1)));
    } else {
      entries.push({
        type: "glob",
        glob: normalizeToPosix(pattern),
        input: pattern,
      });
    }
  }

  for (const { type, glob, input } of entries) {
    let result;

    try {
      result = await fastGlob(glob, globOptions);
    } catch ({ message }: any) {
      /* c8 ignore next 4 */
      yield {
        error: `${errorMessages.globError[type]}: "${input}".\n${message}`,
      };
      continue;
    }

    if (result.length !== 0) {
      yield* sortPaths(result);
    }
  }

  function getSupportedFilesGlob() {
    if (!supportedFilesGlob) {
      const extensions = context.languages.flatMap(
        (lang) => lang.extensions || [],
      );
      const filenames = context.languages.flatMap(
        (lang) => lang.filenames || [],
      );
      supportedFilesGlob = `**/{${[
        ...extensions.map((ext) => "*" + (ext[0] === "." ? ext : "." + ext)),
        ...filenames,
      ]}}`;
    }
    return supportedFilesGlob;
  }
}

const errorMessages = {
  globError: {
    file: "Unable to resolve file",
    dir: "Unable to expand directory",
    glob: "Unable to expand glob pattern",
  },
  emptyResults: {
    file: "Explicitly specified file was ignored due to negative glob patterns",
    dir: "No supported files were found in the directory",
    glob: "No files matching the pattern were found",
  },
};

function containsIgnoredPathSegment(
  absolutePath: string,
  cwd: string,
  ignoredDirectories: string[],
) {
  return path
    .relative(cwd, absolutePath)
    .split(path.sep)
    .some((dir) => ignoredDirectories.includes(dir));
}

function sortPaths(paths: string[]) {
  return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * This function should be replaced with `fastGlob.escapePath` when these issues are fixed:
 * - https://github.com/mrmlnc/fast-glob/issues/261
 * - https://github.com/mrmlnc/fast-glob/issues/262
 */
function escapePathForGlob(path: string) {
  return fastGlob
    .escapePath(
      path.replaceAll("\\", "\0"), // Workaround for fast-glob#262 (part 1)
    )
    .replaceAll("\\!", "@(!)") // Workaround for fast-glob#261
    .replaceAll("\0", "@(\\\\)"); // Workaround for fast-glob#262 (part 2)
}
