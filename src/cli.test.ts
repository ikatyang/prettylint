import * as fs from 'fs';
import * as path from 'path';
import strip_ansi = require('strip-ansi');
import { run } from './cli';

const base_dir = path.resolve(__dirname, '../fixtures/cli');

let status: number | undefined;
let stdout: string | undefined;
let writes: { filename: string; content: string }[];

setup();

test('ignorePath: default, .prettierignore exists', async () =>
  run_cli(['**/*.js'], {
    cwd: `${base_dir}/ignore-path/default-with-prettierignore`,
  }).then(results => {
    expect(status).toBe(0);
    expect(results).toMatchSnapshot();
  }));

test('ignorePath: default, .prettierignore does not exist', async () =>
  run_cli(['**/*.js'], {
    cwd: `${base_dir}/ignore-path/default-without-prettierignore`,
  }).then(results => {
    expect(status).toBe(0);
    expect(results).toMatchSnapshot();
  }));

test('ignorePath: ".ignore"', async () =>
  run_cli(['**/*.js', '--ignore-path', '.ignore'], {
    cwd: `${base_dir}/ignore-path/custom-ignore`,
  }).then(results => {
    expect(status).toBe(0);
    expect(results).toMatchSnapshot();
  }));

test('fix: true', async () =>
  run_cli(['**/*.js', '--fix'], { cwd: `${base_dir}/fix` }).then(() => {
    expect(status).toBe(0);
    expect(stdout).toBe(undefined);
    expect(writes).toMatchSnapshot();
  }));

test('format: default', async () =>
  run_cli(['**/*.js'], { cwd: `${base_dir}/format/default` }).then(() => {
    expect(status).toBe(1);
    expect(stdout).toMatchSnapshot();
  }));

test('silent: true', async () =>
  run_cli(['**/*.js', '--silent'], { cwd: `${base_dir}/silent` }).then(() => {
    expect(status).toBe(1);
    expect(stdout).toBe(undefined);
  }));

interface RunCliOptions {
  cwd: string;
}

async function run_cli(argv: string[], options: RunCliOptions) {
  process.chdir(options.cwd);
  return run(argv).then(results => {
    status =
      status !== undefined
        ? status
        : // tslint:disable-next-line:strict-type-predicates
          process.exitCode !== undefined ? process.exitCode : 0;
    stdout = stdout === undefined ? undefined : strip_ansi(stdout);
    return results;
  });
}

function setup() {
  const original_cwd = process.cwd();
  const original_env_ci = process.env.CI;
  const original_exit_code = process.exitCode;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation((...messages: string[]) => {
      if (!is_exited()) {
        stdout = `${stdout === undefined ? '' : stdout}${messages.join(' ')}\n`;
      }
    });
    jest
      .spyOn(fs, 'writeFile')
      .mockImplementation(
        (filename: string, content: string, callback: () => void) => {
          if (!is_exited()) {
            writes.push({ filename, content });
          }
          callback();
        },
      );
    jest.spyOn(process, 'exit').mockImplementation((exit_code?: number) => {
      if (!is_exited()) {
        status = exit_code === undefined ? 0 : exit_code;
      }
    });

    function is_exited() {
      // tslint:disable-next-line:strict-type-predicates
      return status !== undefined || process.exitCode !== undefined;
    }
  });

  beforeEach(() => {
    process.env.CI = 'true';
    process.exitCode = undefined as any;

    status = undefined;
    stdout = undefined;
    writes = [];
  });

  afterAll(() => {
    process.chdir(original_cwd);
    process.exitCode = original_exit_code;

    if (original_env_ci !== undefined) {
      process.env.CI = original_env_ci;
    } else {
      delete process.env.CI;
    }
  });
}
