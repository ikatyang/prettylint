import { expect, test } from "vitest";
import { diagnose } from "./diagnose.js";

test("already formatted", async () => {
  expect(
    await diagnose('const x = "a";\n', { parser: "babel" }),
  ).toMatchSnapshot();
});

test("operation: insert", async () => {
  expect(
    await diagnose('const x= "a";\n', { parser: "babel" }),
  ).toMatchSnapshot();
});

test("operation: delete", async () => {
  expect(
    await diagnose('const x  = "a";\n', { parser: "babel" }),
  ).toMatchSnapshot();
});

test("operation: replace", async () => {
  expect(
    await diagnose("const x = 'a';\n", { parser: "babel" }),
  ).toMatchSnapshot();
});
