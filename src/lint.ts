import * as path from 'path';
import * as prettier from 'prettier';
import { diagnose } from './diagnose';

// https://eslint.org/docs/developer-guide/working-with-custom-formatters#description-of-the-results
export interface LintResult {
  /**
   * The path to the file relative to the current working directory (the path from which eslint was executed).
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

export interface LintOptions {
  config?: boolean | string;
}

export async function lint(
  filename: string,
  content: string,
  options: LintOptions = {},
): Promise<LintResult> {
  const { config = true } = options;

  const absolute_filename = path.resolve(filename);
  const relative_filename = path.relative('.', filename);

  const node_type = 'Unknown';
  const rule_id = 'prettier/prettier';

  try {
    const prettier_options =
      config === false
        ? null
        : await prettier.resolveConfig(absolute_filename, {
            config: config === true ? undefined : config,
          });

    const { diagnostics, formatted } = diagnose(content, {
      filepath: filename,
      ...prettier_options,
    });

    const messages = diagnostics.map(
      ({ message, start: { line, column } }): LintMessage => ({
        ruleId: rule_id,
        severity: LintSeverity.Warning,
        line,
        column,
        message,
        nodeType: node_type,
      }),
    );

    return {
      filePath: relative_filename,
      source: content,
      ...messages.length === 0 ? {} : { output: formatted },
      messages,
      errorCount: 0,
      warningCount: messages.length,
    };
  } catch (error) {
    const message: LintMessage = {
      ruleId: rule_id,
      severity: LintSeverity.Error,
      nodeType: node_type,
      ...error.loc
        ? // SyntaxError from parser in prettier
          {
            line: error.loc.start.line,
            column: error.loc.start.column,
            message: error.message.split('\n', 1)[0], // cut the code-frame
          }
        : // istanbul ignore next
          {
            line: 0,
            column: 0,
            message:
              /* istanbul ignore next */ typeof error.message === 'string'
                ? error.message
                : error,
          },
    };
    return {
      filePath: relative_filename,
      source: content,
      messages: [message],
      errorCount: 1,
      warningCount: 0,
    };
  }
}
