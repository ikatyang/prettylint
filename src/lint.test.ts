import { expect, test } from "vitest";
import { lint } from "./lint.js";

test("failure", () => {
  const result = lint({
    type: "failure",
    filename: "path/to/somewhere.js",
    input: "const 123;",
    error: {
      message: "Unexpected token (1:7)",
      loc: { start: { line: 1, column: 7 } },
    },
  });
  expect(result).toMatchSnapshot();
});

test("success", () => {
  const result = lint({
    type: "success",
    filename: "path/to/somewhere.js",
    input: "let x = 1;\n",
    output: "let x = 1;\n",
  });
  expect(result).toMatchSnapshot();
});
