import { LinesAndColumns } from "lines-and-columns";
import * as prettier from "prettier";
import * as utils from "prettier-linter-helpers";

export interface DiagnoseResult {
  formatted: string;
  diagnostics: Diagnostic[];
}

export interface Diagnostic {
  start: Location;
  end: Location;
  message: string;
  operation: Operation;
  insertText: string;
  deleteText: string;
}

export enum Operation {
  Delete,
  Insert,
  Replace,
}

export interface Location {
  /** 1-based */
  line: number;
  /** 0-based */
  column: number;
  /** 0-based */
  offset: number;
}

export async function diagnose(
  content: string,
  options?: prettier.Options,
): Promise<DiagnoseResult> {
  const diagnostics: Diagnostic[] = [];

  const formatted = await prettier.format(content, options);
  const differences = utils.generateDifferences(content, formatted);

  if (differences.length !== 0) {
    differences.forEach((difference) => {
      const {
        offset: startOffset,
        deleteText = "",
        insertText = "",
      } = difference;

      const endOffset = startOffset + deleteText.length;

      const insertCode = utils.showInvisibles(insertText);
      const deleteCode = utils.showInvisibles(deleteText);

      let message: string;
      let operation: Operation;

      switch (difference.operation) {
        case "delete":
          operation = Operation.Delete;
          message = `Delete \`${deleteCode}\``;
          break;
        case "insert":
          operation = Operation.Insert;
          message = `Insert \`${insertCode}\``;
          break;
        case "replace":
          operation = Operation.Replace;
          message = `Replace \`${deleteCode}\` with \`${insertCode}\``;
          break;
        /* c8 ignore start */
        default:
          throw new Error(`Unexpected operation '${difference.operation}'`);
        /* c8 ignore stop */
      }

      const locator = new LinesAndColumns(content);
      const getLocation = (offset: number): Location => {
        const { line, column } = locator.locationForIndex(offset)!;
        return { line, column, offset };
      };

      diagnostics.push({
        start: getLocation(startOffset),
        end: getLocation(endOffset),
        message,
        operation,
        insertText: insertText,
        deleteText: deleteText,
      });
    });
  }

  return { diagnostics, formatted };
}
