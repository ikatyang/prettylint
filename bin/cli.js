#!/usr/bin/env node

import { run } from "../lib/cli.js";

await run(process.argv.slice(2));
