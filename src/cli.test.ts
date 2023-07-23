import * as path from "node:path";
import stripAnsi from "strip-ansi";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { run } from "./cli.js";

const baseDir = path.resolve(__dirname, "../fixtures/cli");

let status: number | undefined;
let stdout: string | undefined;
let writes: { filename: string; content: string }[];

setup();

test("ignorePath: default, .prettierignore exists", async () => {
  const results = await runCli(["**/*.js"], {
    cwd: `${baseDir}/ignore-path/default-with-prettierignore`,
  });
  expect(status).toBe(0);
  expect(results).toMatchSnapshot();
});

test("ignorePath: default, .prettierignore does not exist", async () => {
  const results = await runCli(["**/*.js"], {
    cwd: `${baseDir}/ignore-path/default-without-prettierignore`,
  });
  expect(status).toBe(0);
  expect(results).toMatchSnapshot();
});

test('ignorePath: ".ignore"', async () => {
  const results = await runCli(["**/*.js", "--ignore-path", ".ignore"], {
    cwd: `${baseDir}/ignore-path/custom-ignore`,
  });
  expect(status).toBe(0);
  expect(results).toMatchSnapshot();
});

test("fix: true", async () => {
  await runCli(["**/*.js", "--fix"], { cwd: `${baseDir}/fix` });
  expect(status).toBe(0);
  expect(stdout).toBe(undefined);
  expect(writes).toMatchSnapshot();
});

test("format: default", async () => {
  await runCli(["**/*.js"], { cwd: `${baseDir}/format/default` });
  expect(status).toBe(1);
  expect(stdout).toMatchSnapshot();
});

test("silent: true", async () => {
  await runCli(["**/*.js", "--silent"], { cwd: `${baseDir}/silent` });
  expect(status).toBe(1);
  expect(stdout).toBe(undefined);
});

interface RunCliOptions {
  cwd: string;
}

async function runCli(argv: string[], options: RunCliOptions) {
  process.chdir(options.cwd);
  const results = await run(argv);
  status =
    status !== undefined
      ? status
      : process.exitCode !== undefined
      ? process.exitCode
      : 0;
  stdout = stdout === undefined ? undefined : stripAnsi(stdout);
  return results;
}

function setup() {
  const originalCwd = process.cwd();
  const originalEnvCi = process.env.CI;
  const originalExitCode = process.exitCode;

  beforeAll(() => {
    vi.spyOn(console, "log").mockImplementation((...messages: string[]) => {
      if (!isExited()) {
        stdout = `${stdout === undefined ? "" : stdout}${messages.join(" ")}\n`;
      }
    });
    vi.mock("node:fs", async () => {
      return {
        ...(await vi.importActual<typeof import("node:fs")>("node:fs")),
        writeFile: vi
          .fn()
          .mockImplementation(
            (filename: string, content: string, callback: () => void) => {
              if (!isExited()) {
                writes.push({ filename, content });
              }
              callback();
            },
          ),
      };
    });
    vi.spyOn(process, "exit").mockImplementation((exitCode?: number) => {
      if (!isExited()) {
        status = exitCode === undefined ? 0 : exitCode;
      }
      return undefined as never;
    });
  });

  beforeEach(() => {
    process.env.CI = "true";
    process.exitCode = undefined as any;

    status = undefined;
    stdout = undefined;
    writes = [];
  });

  afterAll(() => {
    process.chdir(originalCwd);
    process.exitCode = originalExitCode;

    if (originalEnvCi !== undefined) {
      process.env.CI = originalEnvCi;
    } else {
      delete process.env.CI;
    }
  });
}

function isExited() {
  return status !== undefined || process.exitCode !== undefined;
}
