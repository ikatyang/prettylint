import * as fs from 'fs';
import globby = require('globby');
import ignore = require('ignore');
import meow = require('meow');
import * as path from 'path';
import { lint, LintResult } from './lint';

type Formatter = (results: LintResult[]) => string;

// tslint:disable-next-line:no-inferrable-types
export const help_message: string = `
  Usage
    $ prettylint <glob> ...

  Options
    --no-config           Do not load config file.
    --config <path>       Specify the config file. (require prettier@1.7.1+)
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
  const { input, flags } = meow(
    {
      argv,
      version: true,
      help: help_message,
    },
    {
      alias: {
        h: 'help',
        v: 'version',
      },
      boolean: ['fix', 'silent'],
      string: ['config', 'ignore-path', 'format'],
      default: {
        fix: false,
        format: 'eslint-formatter-pretty',
        silent: false,
      },
    },
  );

  const ignorer = ignore();
  const default_ignore_path = '.prettierignore';

  if (flags.ignorePath === undefined) {
    if (!fs.existsSync(default_ignore_path)) {
      input.push('!**/node_modules/**');
    } else {
      ignorer.add(await read_file(default_ignore_path));
    }
  } else {
    ignorer.add(await read_file(flags.ignorePath));
  }

  const filenames: string[] = ignorer.filter(
    (await globby(input, { dot: true })).map(filename =>
      path.relative('.', filename),
    ),
  ) as any;

  let error_count = 0;
  let warning_count = 0;

  const results = await Promise.all(
    filenames.map(async filename => {
      const content = await read_file(filename);
      const result = await lint(filename, content, { config: flags.config });

      error_count += result.errorCount;
      warning_count += result.warningCount;

      if (result.output === undefined || !flags.fix) {
        return result;
      }

      await write_file(filename, result.output);

      // tslint:disable-next-line:no-unused
      const { output, ...new_result } = result;
      return { ...new_result, messages: [], warningCount: 0 };
    }),
  );

  if (!flags.silent) {
    const formatter: Formatter = require(flags.format);
    const message = formatter(results);
    if (message.length !== 0) {
      // tslint:disable-next-line:no-console
      console.log(message);
    }
  }

  if (error_count !== 0 || (!flags.fix && warning_count !== 0)) {
    process.exitCode = 1;
  }

  return results;
}

async function read_file(filename: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, { encoding: 'utf8' }, (error, data) => {
      // istanbul ignore if
      // tslint:disable-next-line:strict-boolean-expressions
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

async function write_file(filename: string, content: string) {
  return new Promise<never>((resolve, reject) => {
    fs.writeFile(filename, content, error => {
      // istanbul ignore if
      // tslint:disable-next-line:strict-boolean-expressions
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
