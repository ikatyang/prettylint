import * as path from 'path';
import { lint } from './lint';

const base_dir = path.resolve(__dirname, '../fixtures/lint');

test('filename: any, config: false', async () =>
  lint('path/to/somewhere', 'const n = 0;', { config: false }).then(result => {
    expect(result.output).toBe('const n = 0;\n');
  }));

test('filename: any, config: "path/to/singleQuote/.prettierrc"', async () => {
  const config = `${base_dir}/singleQuote/.prettierrc`;
  return lint('path/to/somewhere', 'let x = "hi";', { config }).then(result => {
    expect(result.output).toBe("let x = 'hi';\n");
  });
});

test('filename: "path/to/useTabs/file.js", config: undefined', async () => {
  const filename = `${base_dir}/useTabs/file.js`;
  return lint(filename, 'if (true) { console.log(123); }').then(result => {
    expect(result.output).toBe('if (true) {\n\tconsole.log(123);\n}\n');
  });
});

test('content: SyntaxError', async () =>
  lint('path/to/somewhere', 'const 123;', { config: false }).then(result => {
    expect(result).toMatchSnapshot();
  }));

test('content: formatted', async () =>
  lint('path/to/somewhere', 'let x = 1;\n', { config: false }).then(result => {
    expect(result).toMatchSnapshot();
  }));

test('filename: "path/to/filepath/example.json"', async () =>
  lint('path/to/somewhere.json', '{\n"name": "hello"\n}').then(result => {
    expect(result.output).toBe('{\n  "name": "hello"\n}\n');
  }));
