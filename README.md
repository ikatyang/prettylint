# prettylint

[![npm](https://img.shields.io/npm/v/prettylint.svg)](https://www.npmjs.com/package/prettylint)
[![build](https://img.shields.io/github/actions/workflow/status/ikatyang/prettylint/test.yml)](https://github.com/ikatyang/prettylint/actions?query=branch%3Amaster)

Run Prettier as a linter

[Changelog](https://github.com/ikatyang/prettylint/blob/master/CHANGELOG.md)

## Sample

```
$ prettylint "**/*.ts"

  src/diagnose.ts:14:13
  ⚠  14:13  Delete ·                                          prettier/prettier
  ⚠  15:14  Insert ·                                          prettier/prettier
  ⚠  47:34  Replace "" with ''                                prettier/prettier

  3 warnings
```

## Install

```sh
npm install prettylint
```

## Usage

```sh
Usage
  $ prettylint [options] [file/dir/glob ...]

Options
  --no-config           Do not load config file.
  --config <path>       Specify the config file.
  --no-editorconfig     Do not load .editorconfig
  --fix                 Fix linting errors.
  --format <path>       Specify the module to format output.
                        Defaults to "eslint-formatter-pretty".
  --ignore-path <path>  Specify the .ignore file.
                        Defaults to [".gitignore", ".prettierignore"].
  --silent              Do not print message.
  --with-node-modules   Process files inside 'node_modules' directory.
  -h, --help            Show help.
  -v, --version         Show version.

Examples
  $ prettylint .
  $ prettylint . --fix
```

## Development

```sh
# lint
pnpm run lint

# build
pnpm run build

# test
pnpm run test
```

## License

MIT © [Ika](https://github.com/ikatyang)
