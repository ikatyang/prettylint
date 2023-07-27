import { expect } from "vitest";
import ansi from "jest-snapshot-serializer-ansi";
import path from "./scripts/jest-snapshot-serializer-path.js";

expect.addSnapshotSerializer(path);
expect.addSnapshotSerializer(ansi);
