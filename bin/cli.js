#!/usr/bin/env node
import { main } from '../src/index.js';

main(process.argv.slice(2)).catch((error) => {
  console.error(`\n  Error: ${error.message}\n`);
  process.exit(1);
});
