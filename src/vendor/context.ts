// modified from https://github.com/prettier/prettier/blob/3.0.0/src/cli/context.js

export interface Context {
  argv: {
    filePatterns: string[];
    ignorePath: string[];
    config?: string | false;
    editorconfig?: boolean;
    withNodeModules?: boolean;
    write?: boolean;
  };
  languages: Array<{ extensions?: string[]; filenames?: string[] }>;
}
