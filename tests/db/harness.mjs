// Ambiente de teste de banco: carrega TODAS as migrações do projeto num Postgres local (PGlite)
// com stubs mínimos do Supabase (auth, storage, papéis). Não substitui um teste no Supabase real.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const STUBS = `
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA extensions;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE, raw_user_meta_data jsonb DEFAULT '{}'::jsonb, email_confirmed_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true),''),'anon') $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('sub', auth.uid(), 'role', auth.role()) $$;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean DEFAULT false, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name, '/') $$;
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;
`;

export function migrationFiles() {
  const sup = readdirSync(join(root, "supabase/migrations")).filter(f => f.endsWith(".sql")).sort().map(f => join(root, "supabase/migrations", f));
  const dri = readdirSync(join(root, "drizzle/migrations")).filter(f => /^\d{4}_.*\.sql$/.test(f)).sort().map(f => join(root, "drizzle/migrations", f));
  // Ordem real: migrações do Supabase (até 07/out) e depois as do drizzle (a partir de 12/out).
  return [...sup, ...dri];
}

/** seedAfter: { tag: "0016", fn } executa fn com o banco no estado de uma migração antiga (para testar migrações de dados). */
export async function boot({ upTo, seedAfter } = {}) {
  const db = new PGlite();
  await db.exec(STUBS);
  let seeded = !seedAfter;
  for (const file of migrationFiles()) {
    const name = file.split("/").pop();
    if (upTo && file.includes("drizzle/migrations") && name > upTo) break;
    if (!seeded && file.includes("drizzle/migrations") && name.slice(0, 4) > seedAfter.tag) { await seedAfter.fn(db); seeded = true; }
    try { await db.exec(readFileSync(file, "utf8")); }
    catch (e) { throw new Error(`Falha em ${name}: ${e.message}`); }
  }
  return db;
}

export async function newUser(db, email, meta = {}) {
  const r = await db.query("INSERT INTO auth.users(email, raw_user_meta_data) VALUES ($1,$2) RETURNING id", [email, JSON.stringify(meta)]);
  return r.rows[0].id;
}

/** Executa fn com o papel `authenticated` e o usuário informado (equivale a uma chamada direta ao Supabase). */
export async function as(db, userId, fn) {
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${userId}',false), set_config('request.jwt.claim.role','authenticated',false);`);
  try { return await fn(db); }
  finally { await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false), set_config('request.jwt.claim.role','',false);"); }
}

export async function asAnon(db, fn) {
  await db.exec("SET ROLE anon; SELECT set_config('request.jwt.claim.sub','',false);");
  try { return await fn(db); } finally { await db.exec("RESET ROLE;"); }
}

export async function expectError(promise, pattern) {
  try { await promise; } catch (e) { if (!pattern || pattern.test(e.message)) return e; throw new Error(`Erro inesperado: ${e.message}`); }
  throw new Error("Era esperado um erro, mas a operação foi permitida");
}
