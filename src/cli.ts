import * as fs from "node:fs";
import * as path from "node:path";
import { globby } from "globby";
import ignore from "ignore";
import meow from "meow";
import { lint, LintResult } from "./lint.js";

type Formatter = (results: LintResult[]) => string;

export const helpMessage: string = `
  Usage
    $ prettylint <glob> ...

  Options
    --no-config           Do not load config file.
    --config <path>       Specify the config file.
    --fix                 Fix linting errors.
    --format <path>       Specify the module to format output.
                          Defaults to "eslint-formatter-pretty".
    --ignore-path <path>  Specify the .ignore file.
                          Defaults to ".prettierignore".
    --silent              Do not print message.
    -h, --help            Show help.
    -v, --version         Show version.

  Examples
    $ prettylint "src/**/*.{js,ts}"
    $ prettylint "src/**/*.{js,ts}" --fix
    $ prettylint "src/**/*.{js,ts}" --ignore-path .gitignore
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
      ignorePath: {
        type: "string",
      },
      format: {
        type: "string",
        default: "eslint-formatter-pretty",
      },
      help: {
        aliases: ["h"],
      },
      version: {
        aliases: ["v"],
      },
    },
  });

  const ignorer = ignore.default();
  const defaultIgnorePath = ".prettierignore";

  if (flags.ignorePath === undefined) {
    if (!fs.existsSync(defaultIgnorePath)) {
      input.push("!**/node_modules/**");
    } else {
      ignorer.add(await readFile(defaultIgnorePath));
    }
  } else {
    ignorer.add(await readFile(flags.ignorePath));
  }

  const filenames = ignorer.filter(
    (await globby(input, { dot: true })) //
      .map((filename) => path.relative(".", filename)),
  );

  let errorCount = 0;
  let warningCount = 0;

  const results = await Promise.all(
    filenames.map(async (filename) => {
      const content = await readFile(filename);
      const result = await lint(filename, content, { config: flags.config });

      errorCount += result.errorCount;
      warningCount += result.warningCount;

      if (result.output === undefined || !flags.fix) {
        return result;
      }

      await writeFile(filename, result.output);

      const { output, ...newResult } = result;
      return { ...newResult, messages: [], warningCount: 0 };
    }),
  );

  if (!flags.silent) {
    const formatter: Formatter = (await import(flags.format)).default;
    const message = formatter(results);
    if (message.length !== 0) {
      console.log(message);
    }
  }

  if (errorCount !== 0 || (!flags.fix && warningCount !== 0)) {
    process.exitCode = 1;
  }

  return results;
}

async function readFile(filename: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, { encoding: "utf8" }, (error, data) => {
      /* c8 ignore start */
      if (error) {
        reject(error);
      } /* c8 ignore stop */ else {
        resolve(data);
      }
    });
  });
}

async function writeFile(filename: string, content: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filename, content, (error) => {
      /* c8 ignore start */
      if (error) {
        reject(error);
      } /* c8 ignore stop */ else {
        resolve();
      }
    });
  });
}
