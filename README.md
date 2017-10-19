# prettylint

[![npm](https://img.shields.io/npm/v/prettylint.svg)](https://www.npmjs.com/package/prettylint)
[![build](https://img.shields.io/travis/ikatyang/prettylint/master.svg)](https://travis-ci.org/ikatyang/prettylint/builds)
[![coverage](https://img.shields.io/codecov/c/github/ikatyang/prettylint/master.svg)](https://codecov.io/gh/ikatyang/prettylint)

Run Prettier as a linter

[Changelog](https://github.com/ikatyang/prettylint/blob/master/CHANGELOG.md)

## Install

```sh
# using npm
npm install --save-dev prettylint prettier

# using yarn
yarn add --dev prettylint prettier
```

## Usage

<!-- AUTO-GENERATED-CONTENT:START (helpMessage) -->

```sh
Usage
  $ prettylint <glob> ...

Options
  --no-config           Do not load config file.
  --config <path>       Specify the config file. (require prettier@1.7.1+)
  --fix                 Fix linting errors.
  --format <path>       Specify the module to format output.
                        Defaults to "eslint-formatter-pretty".
  --ignore-path <path>  Specify the .ignore file.
                        Defaults to ".prettierignore".
  --silent              Do not print message.
  -h, --help            Show help.
  -v, --version         Show version.

Examples
  $ prettylint "src/**/*.{js,ts}"
  $ prettylint "src/**/*.{js,ts}" --fix
  $ prettylint "src/**/*.{js,ts}" --ignore-path .gitignore
```

<!-- AUTO-GENERATED-CONTENT:END -->

## Development

```sh
# lint
yarn run lint

# build
yarn run build

# test
yarn run test
```

## License

MIT © [Ika](https://github.com/ikatyang)
