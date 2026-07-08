import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const projectRef = "tdfpzuewwziofsbmjxdj";
const defaultUrl = `https://${projectRef}.supabase.co`;
const url = process.env.SUPABASE_URL || defaultUrl;
const anonKey = process.env.SUPABASE_ANON_KEY || "";

if (!anonKey) {
  console.error("Missing SUPABASE_ANON_KEY.");
  console.error("Get it from: https://supabase.com/dashboard/project/tdfpzuewwziofsbmjxdj/settings/api");
  process.exit(1);
}

const configPath = join(root, "..", "public", "supabase-config.js");
const config = `window.SUPABASE_CONFIG = ${JSON.stringify({ url, anonKey }, null, 2)};\n`;
writeFileSync(configPath, config, "utf8");
console.log(`Wrote ${configPath}`);

const setupSql = readFileSync(join(root, "..", "supabase", "setup.sql"), "utf8");
const probe = await fetch(`${url}/rest/v1/ideas`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "content-type": "application/json",
    Prefer: "return=minimal"
  },
  body: JSON.stringify({ idea_text: "__jsonrender_setup_probe__" })
});

if (probe.status === 404) {
  console.error("ideas table not found. Run supabase/setup.sql in the Supabase SQL Editor first.");
  process.exit(1);
}

if (!probe.ok) {
  const body = await probe.text();
  console.error(`Supabase probe failed (${probe.status}): ${body}`);
  process.exit(1);
}

console.log("Supabase connection OK. Anonymous insert works.");
