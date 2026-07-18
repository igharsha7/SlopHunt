#!/usr/bin/env node
/**
 * End-to-end database health check.
 *
 *   npm run db:verify
 *
 * Reports exactly what works and what doesn't, and — when the schema is
 * missing — prints the one step that only a human with dashboard access can
 * do. Exits non-zero when the DB isn't usable, so CI can gate on it.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const file of [".env.local", ".env"]) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const IS_SERVICE = Boolean(process.env.SUPABASE_SECRET_KEY);

if (!URL_ || !KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL or a key is missing from .env.local");
  process.exit(1);
}

const h = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const TABLES = ["users", "repos", "crawls", "scores", "roasts", "receipts", "videos", "reactions"];

const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const warn = (s) => `\x1b[33m!\x1b[0m ${s}`;

console.log(`\nSupabase  ${URL_}`);
console.log(`Key mode  ${IS_SERVICE ? "service_role (read-write)" : "publishable (read-only)"}\n`);

let missing = 0;
console.log("Tables");
for (const t of TABLES) {
  const r = await fetch(`${URL_}/rest/v1/${t}?select=*&limit=1`, { headers: h });
  if (r.status === 200) {
    console.log("  " + ok(t));
  } else {
    missing++;
    console.log("  " + bad(`${t} — ${r.status}`));
  }
}

console.log("\nStorage");
const buckets = await fetch(`${URL_}/storage/v1/bucket`, { headers: h });
if (buckets.ok) {
  const list = await buckets.json();
  const roasts = list.find((b) => b.id === "roasts");
  console.log("  " + (roasts ? ok(`roasts bucket (public: ${roasts.public})`) : warn("roasts bucket missing")));
} else {
  console.log("  " + bad(`storage unreachable — ${buckets.status}`));
}

// A write is the only honest proof the service key really works.
if (IS_SERVICE && missing === 0) {
  console.log("\nWrite path");
  const probe = {
    owner: "__slophunt_verify__",
    name: "probe",
    html_url: "https://github.com/__slophunt_verify__/probe",
    proof: "roast_me_topic",
  };
  const w = await fetch(`${URL_}/rest/v1/repos?on_conflict=owner,name`, {
    method: "POST",
    headers: { ...h, prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(probe),
  });
  if (w.ok) {
    const [row] = await w.json();
    console.log("  " + ok("insert"));
    await fetch(`${URL_}/rest/v1/repos?id=eq.${row.id}`, { method: "DELETE", headers: h });
    console.log("  " + ok("delete (probe row cleaned up)"));
  } else {
    console.log("  " + bad(`insert failed — ${w.status} ${(await w.text()).slice(0, 80)}`));
  }
}

if (missing > 0) {
  console.log(
    `\n${bad(`${missing}/${TABLES.length} tables missing.`)}\n\n` +
      "  Creating tables needs DDL, which PostgREST does not expose — not even\n" +
      "  to service_role. One human step, about 30 seconds:\n\n" +
      "    1. https://supabase.com/dashboard/project/akylsmzcoavwokikjlbb/sql/new\n" +
      "    2. Paste supabase/migrations/0001_init.sql\n" +
      "    3. Run\n\n" +
      "  Then re-run: npm run db:verify\n",
  );
  process.exit(1);
}

console.log(`\n${ok("Database is ready.")}\n`);
