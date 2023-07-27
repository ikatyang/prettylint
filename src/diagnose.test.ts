import { expect, test } from "vitest";
import { diagnose } from "./diagnose.js";

test("already formatted", () => {
  expect(diagnose('const x = "a";\n', 'const x = "a";\n')).toMatchSnapshot();
});

test("operation: insert", () => {
  expect(diagnose('const x= "a";\n', 'const x = "a";\n')).toMatchSnapshot();
});

test("operation: delete", () => {
  expect(diagnose('const x  = "a";\n', 'const x = "a";\n')).toMatchSnapshot();
});

test("operation: replace", () => {
  expect(diagnose("const x = 'a';\n", 'const x = "a";\n')).toMatchSnapshot();
});
