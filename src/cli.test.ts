import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { copy, remove } from "fs-extra";
import { expect, test } from "vitest";
import { run } from "./cli.js";

const TEMP_DIR = await fs.realpath(os.tmpdir());
const FIXTURES_DIRNAME = path.resolve(__dirname, "../fixtures");

test("ignorePath: default, .prettierignore exists", async () => {
  const { results, exitCode } = await runCli(
    "ignore-path/default-with-prettierignore",
    ["**/*.js"],
  );
  expect(results).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test("ignorePath: default, .prettierignore does not exist", async () => {
  const { results, exitCode } = await runCli(
    "ignore-path/default-without-prettierignore",
    ["**/*.js"],
  );
  expect(results).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('ignorePath: ".ignore"', async () => {
  const { results, exitCode } = await runCli("ignore-path/custom-ignore", [
    "**/*.js",
    "--ignore-path",
    ".ignore",
  ]);
  expect(results).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test("fix: true", async () => {
  const { tree, stdout, exitCode } = await runCli("fix", ["**/*.js", "--fix"]);
  expect(tree).toMatchSnapshot();
  expect(stdout).toBe(undefined);
  expect(exitCode).toBe(0);
});

test("format: default", async () => {
  const { stdout, exitCode } = await runCli("format/default", ["**/*.js"]);
  expect(stdout).toMatchSnapshot();
  expect(exitCode).toBe(1);
});

test("silent: true", async () => {
  const { stdout, exitCode } = await runCli("silent", ["**/*.js", "--silent"]);
  expect(exitCode).not.toBe(0);
  expect(stdout).toBe(undefined);
});

async function runCli(fixtureName: string, argv: string[]) {
  const originalConsoleLog = console.log;
  const originalCwd = process.cwd();
  const originalExitCode = process.exitCode;
  const dirname = path.join(
    TEMP_DIR,
    expect.getState().currentTestName!.replace(/[^0-9a-zA-Z]/g, "_"),
  );
  try {
    await fs.mkdir(dirname, { recursive: true });
    const stdout: string[] = [];
    await copy(path.join(FIXTURES_DIRNAME, fixtureName), dirname);
    process.chdir(dirname);
    console.log = (...messages) => {
      if (messages.length) {
        stdout.push(messages.join(" "));
      }
    };
    const results = await run(argv);
    const tree = await getTree(dirname);
    await remove(dirname);
    return {
      tree,
      stdout: stdout.length === 0 ? undefined : stdout.join("\n"),
      results,
      exitCode: process.exitCode ?? 0,
    };
  } finally {
    process.chdir(originalCwd);
    process.exitCode = originalExitCode;
    console.log = originalConsoleLog;
  }
}

async function getTree(directory: string, root = true) {
  let text = root ? "/" : `${path.basename(directory)}/`;
  for (const basename of await fs.readdir(directory)) {
    const filename = path.join(directory, basename);
    const stat = await fs.stat(filename);
    if (stat.isFile()) {
      const content = await fs.readFile(filename, "utf8");
      text += "\n" + indent(basename + "\n" + indent(content));
      continue;
    }
    if (stat.isDirectory()) {
      text += "\n" + indent(await getTree(filename, false));
      continue;
    }
  }
  return text;
}

function indent(text: string) {
  return text
    .split("\n")
    .map((_) => " ".repeat(2) + _)
    .join("\n");
}
