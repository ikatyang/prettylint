import meow from "meow";
import { getSupportInfo } from "prettier";
import { lint, LintResult } from "./lint.js";
import { formatFiles } from "./vendor/format.js";
import { Context } from "./vendor/context.js";

type Formatter = (results: LintResult[]) => string;

export const helpMessage: string = `
  Usage
    $ prettylint [options] [file/dir/glob ...]

  Options
    --no-config           Do not load config file.
    --config <path>       Specify the config file.
    --no-editorconfig     Do not load .editorconfig
    --fix                 Fix linting errors.
    --format <path>       Specify the module to format output.
                          Defaults to "eslint-formatter-pretty".
    --ignore-path <path>  Specify the .ignore file.
                          Defaults to [".gitignore", ".prettierignore"].
    --silent              Do not print message.
    --with-node-modules   Process files inside 'node_modules' directory.
    -h, --help            Show help.
    -v, --version         Show version.

  Examples
    $ prettylint .
    $ prettylint . --fix
`;

export async function run(argv: string[]) {
  const { input, flags } = meow(helpMessage, {
    importMeta: import.meta,
    argv,
    flags: {
      fix: {
        type: "boolean",
        default: false,
      },
      silent: {
        type: "boolean",
        default: false,
      },
      config: {
        type: "string",
      },
      editorconfig: {
        type: "boolean",
        default: true,
      },
      ignorePath: {
        type: "string",
        isMultiple: true,
        default: [".gitignore", ".prettierignore"],
      },
      withNodeModules: {
        type: "boolean",
        default: false,
      },
      format: {
        type: "string",
        default: "eslint-formatter-pretty",
      },
      help: {
        shortFlag: "h",
      },
      version: {
        shortFlag: "v",
      },
    },
  });

  const context: Context = {
    argv: {
      filePatterns: input,
      ignorePath: flags.ignorePath,
      config: flags.config,
      editorconfig: flags.editorconfig,
      withNodeModules: flags.withNodeModules,
      write: flags.fix,
    },
    languages: (await getSupportInfo()).languages,
  };

  const results: LintResult[] = [];
  for await (const result of formatFiles(context)) {
    results.push(lint(result));
  }

  if (!flags.silent) {
    const formatter: Formatter = (await import(flags.format)).default;
    const message = formatter(results);
    if (message.length !== 0) {
      console.log(message);
    }
  }

  if (results.some((_) => _.errorCount || _.warningCount)) {
    process.exitCode = 1;
  }

  return results;
}
