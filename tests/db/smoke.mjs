import { boot } from "./harness.mjs";
const db = await boot();
const t = await db.query(
  "select count(*)::int n from information_schema.tables where table_schema='public'",
);
console.log("tabelas public:", t.rows[0].n);
