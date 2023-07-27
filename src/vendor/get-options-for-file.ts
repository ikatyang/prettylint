// modified from https://github.com/prettier/prettier/blob/3.0.0/src/cli/options/get-options-for-file.js

import { resolveConfig } from "prettier";
import { Context } from "./context.js";

async function getOptionsOrDie(context: Context, filePath: string) {
  if (context.argv.config === false) {
    return null;
  }

  return await resolveConfig(filePath, {
    editorconfig: context.argv.editorconfig,
    config: context.argv.config,
  });
}

export async function getOptionsForFile(context: Context, filepath: string) {
  return await getOptionsOrDie(context, filepath);
}
