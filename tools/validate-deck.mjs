#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

const input = process.argv[2];

if (!input) {
  throw new Error("Usage: node tools/validate-deck.mjs public/example-slides.html");
}

const deckPath = path.resolve(input);
const html = await readFile(deckPath, "utf8");
const failures = [];
const warnings = [];
const slideMatches = html.match(/<[^>]+class=["'][^"']*\bslide\b[^"']*["'][^>]*>/g) || [];
const activeMatches = slideMatches.filter((match) => /\bactive\b/.test(match));

if (slideMatches.length === 0) {
  failures.push("No .slide elements found.");
}

if (activeMatches.length !== 1) {
  failures.push(`Expected exactly one active slide, found ${activeMatches.length}.`);
}

if (!/\bid=["']counter-current["']/.test(html)) {
  failures.push("Missing #counter-current element.");
}

if (!/\bid=["']counter-total["']/.test(html)) {
  failures.push("Missing #counter-total element.");
}

if (!/<script[^>]+src=["']\/deck-runtime\.js["'][^>]*><\/script>/.test(html)) {
  failures.push('Missing shared runtime script: <script src="/deck-runtime.js" ...></script>.');
}

if (/\bid=["']remote-ui["']/.test(html)) {
  warnings.push("Found legacy #remote-ui markup. New decks should rely on /remote and deck-runtime.js.");
}

if (/fetch\(["']\/api\/room["']/.test(html) || /fetch\(["']\/api\/nav["']/.test(html)) {
  warnings.push("Found inline remote API calls. New decks should use deck-runtime.js instead.");
}

if (failures.length > 0) {
  console.error(`Deck validation failed for ${deckPath}`);
  failures.forEach((failure) => console.error(`- ${failure}`));

  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
  }

  process.exit(1);
}

console.log(`Deck validation passed for ${path.relative(process.cwd(), deckPath)}`);
console.log(`Slides: ${slideMatches.length}`);

if (warnings.length > 0) {
  warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
}
