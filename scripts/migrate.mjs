#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql in filename order against DATABASE_URL,
 * tracking applied files in public.schema_migrations so re-runs are no-ops.
 *
 *   npm run db:migrate
 *
 * DATABASE_URL comes from .env.local (never commit it). Use the Supabase
 * "Session pooler" connection string — Dashboard → Connect → Session pooler.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env.local loader — no dotenv dependency needed.
for (const file of [".env.local", ".env"]) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is empty.\n" +
      "Grab the Session pooler string from the Supabase dashboard (Connect →\n" +
      "Session pooler), put it in .env.local, and run this again.",
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  await sql`create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`;

  const applied = new Set(
    (await sql`select name from public.schema_migrations`).map((r) => r.name),
  );

  const dir = join(root, "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= ${file} (already applied)`);
      continue;
    }
    const body = readFileSync(join(dir, file), "utf8");
    console.log(`> ${file} ...`);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into public.schema_migrations (name) values (${file})`;
    });
    console.log(`✓ ${file}`);
    ran++;
  }

  console.log(ran === 0 ? "Nothing to do — schema is current." : `Applied ${ran} migration(s).`);
} finally {
  await sql.end();
}
