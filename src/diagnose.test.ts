import { diagnose } from './diagnose';

test('already formatted', () => {
  expect(diagnose('const x = "a";\n')).toMatchSnapshot();
});

test('operation: insert', () => {
  expect(diagnose('const x= "a";\n')).toMatchSnapshot();
});

test('operation: delete', () => {
  expect(diagnose('const x  = "a";\n')).toMatchSnapshot();
});

test('operation: replace', () => {
  expect(diagnose("const x = 'a';\n")).toMatchSnapshot();
});
