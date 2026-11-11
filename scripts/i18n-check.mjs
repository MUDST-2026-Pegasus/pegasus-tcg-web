#!/usr/bin/env node
/**
 * ตรวจ i18n ใน CI [TCG-549]
 *
 * 1. key ที่โค้ดใช้ (ผล `tolgee extract`) ต้องมีใน src/i18n/<ns>/th.json แล้ว — ไม่งั้นแปลว่าลืม `pnpm i18n:pull` → fail
 * 2. ทุก key ใน th.json ต้องมีใน en.json และไม่ว่าง (key ที่ en ขาดจะ fallback เป็นไทย)
 *    → warn ช่วงย้ายข้อความ, fail เมื่อรันด้วย `--strict` หรือ I18N_STRICT=1 (เปิดใน I18N-21)
 * 3. warning ของ extractor (เช่น t ที่ส่งเป็น parameter) ขึ้นเป็น annotation ใน PR
 *
 * ไม่ต่อ Tolgee — ใช้แค่ไฟล์ใน repo
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const I18N_DIR = "src/i18n";
const DEFAULT_NS = "common";
const strict = process.argv.includes("--strict") || process.env.I18N_STRICT === "1";
const inCi = !!process.env.GITHUB_ACTIONS;

let errors = 0;
let warnings = 0;

function report(level, message, file, line) {
  if (level === "error") errors += 1;
  else warnings += 1;
  if (inCi) {
    const location = file ? ` file=${file}${line ? `,line=${line}` : ""}` : "";
    console.log(`::${level}${location}::${message}`);
  } else {
    console.log(`${level === "error" ? "✗" : "!"} ${file ? `${file}${line ? `:${line}` : ""} ` : ""}${message}`);
  }
}

/** { "a": { "b": "x" } } → { "a.b": "x" } */
function flatten(value, prefix = "", out = {}) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object") flatten(child, path, out);
    else out[path] = child;
  }
  return out;
}

function readNamespace(ns, lang) {
  const file = join(I18N_DIR, ns, `${lang}.json`);
  return existsSync(file) ? flatten(JSON.parse(readFileSync(file, "utf8"))) : null;
}

/** อ่านผล `tolgee extract print` → key ที่ใช้ + warning ต่อไฟล์ */
export function parseExtractOutput(output) {
  const keys = [];
  const extractorWarnings = [];
  let file = null;
  let mode = null;
  for (const raw of output.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const header = line.match(/^\d+ keys? found in (.+):$/);
    if (header) {
      file = header[1];
      mode = "keys";
      continue;
    }
    if (/^\d+ warnings? (was|were) emitted/.test(line)) {
      mode = "warnings";
      continue;
    }
    const entry = line.match(/^\tline (\d+): (.+)$/);
    if (entry && file) {
      if (mode === "warnings") extractorWarnings.push({ file, line: Number(entry[1]), message: entry[2] });
      else keys.push({ file, line: Number(entry[1]), key: entry[2], ns: DEFAULT_NS });
      continue;
    }
    const ns = line.match(/^\t\tnamespace: (.+)$/);
    if (ns && mode === "keys" && keys.length) keys[keys.length - 1].ns = ns[1];
  }
  return { keys, warnings: extractorWarnings };
}

function main() {
  const namespaces = readdirSync(I18N_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const th = Object.fromEntries(namespaces.map((ns) => [ns, readNamespace(ns, "th") ?? {}]));

  // 1 + 3: key ที่โค้ดใช้
  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const output = execFileSync(pnpmCmd, ["exec", "tolgee", "extract", "print"], { encoding: "utf8", shell: true });
  const { keys, warnings: extractorWarnings } = parseExtractOutput(output);
  for (const w of extractorWarnings) report("warning", `tolgee extract: ${w.message}`, w.file, w.line);
  for (const { file, line, key, ns } of keys) {
    if (!(ns in th)) report("error", `namespace "${ns}" ไม่มีใน ${I18N_DIR}`, file, line);
    else if (!(key in th[ns])) {
      report("error", `key "${ns}:${key}" ยังไม่อยู่ใน ${I18N_DIR}/${ns}/th.json — pnpm i18n:sync แล้ว pnpm i18n:pull`, file, line);
    }
  }

  // 2: en ครบ
  const level = strict ? "error" : "warning";
  for (const ns of namespaces) {
    const en = readNamespace(ns, "en") ?? {};
    for (const key of Object.keys(th[ns])) {
      if (typeof en[key] !== "string" || en[key].trim() === "") {
        report(level, `ยังไม่มีคำแปล en ของ "${ns}:${key}"`, join(I18N_DIR, ns, "en.json"));
      }
    }
  }

  console.log(`i18n-check: ${keys.length} keys in code, ${errors} error(s), ${warnings} warning(s)${strict ? " (strict)" : ""}`);
  process.exitCode = errors > 0 ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
