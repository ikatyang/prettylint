// modified from https://github.com/prettier/prettier/blob/3.0.0/src/cli/format.js

import fs from "node:fs/promises";
import { format } from "prettier";
import { createIsIgnoredFunction } from "./ignore.js";
import { expandPatterns } from "./expand-patterns.js";
import { getOptionsForFile } from "./get-options-for-file.js";
import { Context } from "./context.js";

export type FormatResult = FormatResultSuccess | FormatResultFailure;

export interface FormatResultSuccess {
  type: "success";
  filename: string;
  input: string;
  output: string;
}

export interface FormatResultFailure {
  type: "failure";
  filename: string;
  input: string;
  error: any;
}

async function createIsIgnoredFromContextOrDie(context: Context) {
  return await createIsIgnoredFunction(
    context.argv.ignorePath,
    context.argv.withNodeModules,
  );
}

export async function* formatFiles(
  context: Context,
): AsyncGenerator<FormatResult> {
  // This will be used to filter file paths after the glob is checked,
  // before any files are actually written
  const isIgnored = await createIsIgnoredFromContextOrDie(context);

  for await (const pathOrError of expandPatterns(context)) {
    if (typeof pathOrError === "object") {
      throw new Error(pathOrError.error);
    }

    const filename = pathOrError;
    let input = "";

    try {
      const isFileIgnored = isIgnored(filename);
      if (isFileIgnored) {
        continue;
      }
      const options = {
        ...(await getOptionsForFile(context, filename)),
        filepath: filename,
      };

      input = await fs.readFile(filename, "utf8");
      const output = await format(input, options);
      const isDifferent = output !== input;

      if (!isDifferent || !context.argv.write) {
        yield { type: "success", filename, input, output };
        continue;
      }

      await fs.writeFile(filename, output);
    } catch (error) {
      yield { type: "failure", filename, input, error };
    }
  }
}
