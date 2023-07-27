import * as path from "node:path";
import { diagnose } from "./diagnose.js";
import { FormatResult } from "./vendor/format.js";

// https://eslint.org/docs/developer-guide/working-with-custom-formatters#description-of-the-results
export interface LintResult {
  /**
   * The absolute path to the file that was linted.
   */
  filePath: string;
  /**
   * An array of message objects. See below for more info about messages.
   */
  messages: LintMessage[];
  /**
   * The number of errors for the given file.
   */
  errorCount: number;
  /**
   * The number of warnings for the given file.
   */
  warningCount: number;
  /**
   * The source code for the given file. This property is omitted if this file has no errors/warnings or if the `output` property is present.
   */
  source: string;
  /**
   * The source code for the given file with as many fixes applied as possible. This property is omitted if no fix is available.
   */
  output?: string;
}

export const enum LintSeverity {
  Warning = 1,
  Error = 2,
}

export interface LintMessage {
  /**
   * the id of the rule that produced the error or warning.
   */
  ruleId: string;
  /**
   * the severity of the failure, 1 for warnings and 2 for errors.
   */
  severity: LintSeverity;
  /**
   * the human readable description of the error.
   */
  message: string;
  /**
   * the line where the issue is located.
   */
  line: number;
  /**
   * the column where the issue is located.
   */
  column: number;
  /**
   * the type of the node in the AST
   */
  nodeType: string;
}

export function lint(result: FormatResult): LintResult {
  const nodeType = "Unknown";
  const ruleId = "prettier/prettier";

  if (result.type === "success") {
    const { input, output } = result;
    const diagnostics = diagnose(input, output);
    const messages = diagnostics.map(
      ({ message, start: { line, column } }): LintMessage => ({
        ruleId,
        severity: LintSeverity.Warning,
        line,
        column,
        message,
        nodeType,
      }),
    );

    return {
      filePath: result.filename,
      source: input,
      ...(messages.length === 0 ? {} : { output }),
      messages,
      errorCount: 0,
      warningCount: messages.length,
    };
  }

  const { input, error } = result;
  const message: LintMessage = {
    ruleId,
    severity: LintSeverity.Error,
    nodeType,
    ...(error.loc
      ? // SyntaxError from parser in prettier
        {
          line: error.loc.start.line,
          column: error.loc.start.column,
          message: error.message.split("\n", 1)[0], // cut the code-frame
        } /* c8 ignore start */
      : {
          line: 0,
          column: 0,
          message: typeof error?.message === "string" ? error.message : error,
        }) /* c8 ignore stop */,
  };
  return {
    filePath: result.filename,
    source: input,
    messages: [message],
    errorCount: 1,
    warningCount: 0,
  };
}
