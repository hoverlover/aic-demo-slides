#!/usr/bin/env node
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(repoRoot, "app", "decks.json");

const args = parseArgs(process.argv.slice(2));
const name = requireArg(args, "name");
const desc = requireArg(args, "desc");
const href = normalizeHref(requireArg(args, "href"));

await ensurePublicDeckExists(href);

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const existingIndex = catalog.findIndex((deck) => deck.href === href);
const entry = { name, href, desc };

if (existingIndex >= 0) {
  catalog[existingIndex] = entry;
} else {
  catalog.push(entry);
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`${existingIndex >= 0 ? "Updated" : "Registered"} ${href}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    parsed[key] = next && !next.startsWith("--") ? next : "true";

    if (next && !next.startsWith("--")) {
      index += 1;
    }
  }

  return parsed;
}

function requireArg(argsByName, name) {
  const value = argsByName[name];

  if (!value || value === "true") {
    throw new Error(`Missing required argument: --${name}`);
  }

  return value.trim();
}

function normalizeHref(value) {
  const withoutPublic = value.replace(/^public\//, "");
  const href = withoutPublic.startsWith("/") ? withoutPublic : `/${withoutPublic}`;

  if (!/^\/[a-z0-9][a-z0-9/-]*\.html$/i.test(href)) {
    throw new Error(`Deck href must look like /example-slides.html: ${value}`);
  }

  return href;
}

async function ensurePublicDeckExists(href) {
  const deckPath = path.join(repoRoot, "public", href.slice(1));

  try {
    await access(deckPath);
  } catch {
    throw new Error(`Deck file does not exist: ${deckPath}`);
  }
}
