import { LinesAndColumns } from "lines-and-columns";
import * as utils from "prettier-linter-helpers";

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

export function diagnose(input: string, output: string) {
  return utils
    .generateDifferences(input, output)
    .map((difference): Diagnostic => {
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

      const locator = new LinesAndColumns(input);
      const getLocation = (offset: number): Location => {
        const { line, column } = locator.locationForIndex(offset)!;
        return { line, column, offset };
      };

      return {
        start: getLocation(startOffset),
        end: getLocation(endOffset),
        message,
        operation,
        insertText: insertText,
        deleteText: deleteText,
      };
    });
}
