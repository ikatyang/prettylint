import * as utils from 'eslint-plugin-prettier';
import LinesAndColumns from 'lines-and-columns';
import * as prettier from 'prettier';

export interface DiagnoseResult {
  formatted: string;
  diagnostics: Diagnostic[];
}

export interface Diagnostic {
  start: Location;
  end: Location;
  message: string;
  operation: Operation;
  insert_text: string;
  delete_text: string;
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

export function diagnose(
  content: string,
  options?: prettier.Options,
): DiagnoseResult {
  const diagnostics: Diagnostic[] = [];

  const formatted = prettier.format(content, options);
  const differences = utils.generateDifferences(content, formatted);

  if (differences.length !== 0) {
    differences.forEach(difference => {
      const {
        offset: start_offset,
        deleteText: delete_text = '',
        insertText: insert_text = '',
      } = difference;

      const end_offset = start_offset + delete_text.length;

      const insert_code = utils.showInvisibles(insert_text);
      const delete_code = utils.showInvisibles(delete_text);

      let message: string;
      let operation: Operation;

      switch (difference.operation) {
        case 'delete':
          operation = Operation.Delete;
          message = `Delete \`${delete_code}\``;
          break;
        case 'insert':
          operation = Operation.Insert;
          message = `Insert \`${insert_code}\``;
          break;
        case 'replace':
          operation = Operation.Replace;
          message = `Replace \`${delete_code}\` with \`${insert_code}\``;
          break;
        // istanbul ignore next
        default:
          throw new Error(`Unexpected operation '${difference.operation}'`);
      }

      const locator = new LinesAndColumns(content);
      const get_location = (offset: number): Location => {
        const { line, column } = locator.locationForIndex(offset)!;
        return { line, column, offset };
      };

      diagnostics.push({
        start: get_location(start_offset),
        end: get_location(end_offset),
        message,
        operation,
        insert_text,
        delete_text,
      });
    });
  }

  return { diagnostics, formatted };
}
