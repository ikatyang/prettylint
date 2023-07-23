import * as path from "node:path";
import { expect, test } from "vitest";
import { lint } from "./lint.js";

const baseDir = path.resolve(__dirname, "../fixtures/lint");

test("filename: any, config: false", async () => {
  const result = await lint("path/to/somewhere.js", "const n = 0;", {
    config: false,
  });
  expect(result.output).toBe("const n = 0;\n");
});

test('filename: any, config: "path/to/singleQuote/.prettierrc"', async () => {
  const config = `${baseDir}/singleQuote/.prettierrc`;
  const result = await lint("path/to/somewhere.js", 'let x = "hi";', {
    config,
  });
  expect(result.output).toBe("let x = 'hi';\n");
});

test('filename: "path/to/useTabs/file.js", config: undefined', async () => {
  const filename = `${baseDir}/useTabs/file.js`;
  const result = await lint(filename, "if (true) { console.log(123); }");
  expect(result.output).toBe("if (true) {\n\tconsole.log(123);\n}\n");
});

test("content: SyntaxError", async () => {
  const result = await lint("path/to/somewhere.js", "const 123;", {
    config: false,
  });
  expect(result).toMatchSnapshot();
});

test("content: formatted", async () => {
  const result = await lint("path/to/somewhere.js", "let x = 1;\n", {
    config: false,
  });
  expect(result).toMatchSnapshot();
});

test('filename: "path/to/filepath/example.json"', async () => {
  const result = await lint("path/to/somewhere.json", '{\n"name": "hello"\n}');
  expect(result.output).toBe('{\n  "name": "hello"\n}\n');
});
