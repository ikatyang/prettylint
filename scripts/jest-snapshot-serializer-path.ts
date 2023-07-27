import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const TMP_DIR = await fs.realpath(os.tmpdir());
const ROOT_DIR = path.resolve(__dirname, "..");

function test(value: any) {
  return hasString(value, (_) => _.includes(ROOT_DIR) || _.includes(TMP_DIR));
}

function print(value: unknown, serialize: (value: unknown) => string) {
  return serialize(
    mapString(value, (_) =>
      _.replaceAll(ROOT_DIR, "<rootDir>") //
        .replaceAll(TMP_DIR, "<tmpDir>"),
    ),
  );
}

export default { test, print };

function hasString(value: any, predicate: (value: string) => boolean): boolean {
  switch (typeof value) {
    case "string":
      return predicate(value);
    case "object":
      if (Array.isArray(value)) {
        return value.some((_) => hasString(_, predicate));
      }
      if (value) {
        return Object.values(value).some((_) => hasString(_, predicate));
      }
      return false;
    default:
      return false;
  }
}

function mapString<T>(value: T, transform: (value: string) => string): T {
  switch (typeof value) {
    case "string":
      return transform(value) as T;
    case "object":
      if (Array.isArray(value)) {
        return value.map((_) => mapString(_, transform)) as T;
      }
      if (value) {
        return Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, mapString(v, transform)]),
        ) as T;
      }
      return value;
    default:
      return value;
  }
}
