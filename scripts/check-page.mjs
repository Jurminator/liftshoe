// Page rules from playbook-landing-pages that a machine can verify.
// Usage: node scripts/check-page.mjs [--release]
// --release = the gate before going live: warnings about unfinished content become failures.
import { readFileSync, existsSync } from "node:fs";

const release = process.argv.includes("--release");
const htmlPath = "site/index.html";
const cssPath = "site/styles.css";
const failures = [];
const warnings = [];
const fail = (id, msg) => failures.push(`${id} ${msg}`);
const warn = (id, msg) => (release ? failures : warnings).push(`${id} ${msg}`);

if (!existsSync(htmlPath)) {
  console.log(`FAIL ${htmlPath} is missing`);
  process.exit(1);
}
const html = readFileSync(htmlPath, "utf8");
const body = html.replace(/<!--[\s\S]*?-->/g, "");
const beforeFooter = body.split(/<footer[\s>]/i)[0];

// L7 — unfinished content. Placeholders look like [[TODO: price]].
const placeholders = [...body.matchAll(/\[\[TODO:[^\]]*\]\]/g)].map((m) => m[0]);
if (placeholders.length) warn("L7", `placeholders left: ${[...new Set(placeholders)].join(", ")}`);
if (/lorem ipsum/i.test(body)) fail("L7", "lorem ipsum text found");

// S1 — one action: every buy button goes to the same place.
const ctas = [...body.matchAll(/<a\b[^>]*\bdata-cta\b[^>]*>/gi)].map((m) => (m[0].match(/href\s*=\s*(["'])(.*?)\1/i) || [])[2] ?? "");
const ctaTargets = [...new Set(ctas)];
if (ctas.length === 0) warn("S1", "no buy button (an <a data-cta>) on the page");
if (ctaTargets.length > 1) fail("S1", `buy buttons point to different places: ${ctaTargets.join(", ")}`);
if (ctas.length && !/^https:\/\//.test(ctaTargets[0] ?? "")) warn("S1", `buy link is not a real https address: "${ctaTargets[0]}"`);

// S2 — no exits before the footer other than the buy link.
const exits = [...beforeFooter.matchAll(/<a\b[^>]*href\s*=\s*["']((?:https?:)?\/\/[^"']+)["']/gi)].map((m) => m[1]).filter((h) => !ctaTargets.includes(h));
if (exits.length) fail("S2", `outbound links above the footer: ${exits.join(", ")}`);
if (/<nav[\s>]/i.test(beforeFooter)) fail("S2", "navigation menu found above the footer");

// T4 — host-neutral: relative paths only, so the page works under /liftshoe/ and on any other host.
// Also catches protocol-relative //host/… links and url(/…) in CSS.
const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
const rooted = [
  ...[...body.matchAll(/\b(?:href|src|srcset|poster)\s*=\s*["'](\/[^"']*)["']/gi)].map((m) => m[1]),
  ...[...(body + css).matchAll(/url\(\s*["']?(\/[^"')]*)/gi)].map((m) => m[1]),
];
if (rooted.length) fail("T4", `root-absolute paths break on project sites: ${rooted.join(", ")}`);

// L6 — no third-party scripts (no cookies, no trackers) unless allow-listed here.
const allowedScripts = [];
const scripts = [...body.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]).filter((s) => /^(https?:)?\/\//.test(s) && !allowedScripts.includes(s));
if (scripts.length) fail("L6", `third-party scripts: ${scripts.join(", ")}`);
if (/document\.cookie/.test(body)) fail("L6", "page sets cookies");

// Visible text for the copy rules.
const text = beforeFooter
  .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
  .replace(/<\/(p|h[1-6]|li|dt|dd|summary|div|section)>/gi, ". ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ")
  .replace(/\[\[TODO:[^\]]*\]\]/g, " ")
  .replace(/\s+/g, " ");

// L2 — fake-urgency patterns. Real urgency needs a fact in docs/approved-facts.md and a human review.
for (const re of [/only \d+ left/i, /\d+ people (are )?(viewing|watching)/i, /offer ends in/i, /countdown/i, /selling fast/i])
  if (re.test(text)) fail("L2", `urgency/scarcity wording needs a real, recorded constraint: ${re}`);

// C3 — no unqualified superlatives.
const superlatives = ["best", "amazing", "revolutionary", "incredible", "world-class", "ultimate", "unbeatable", "perfect", "game-changing", "miracle"];
const found = superlatives.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
if (found.length) fail("C3", `superlatives without proof: ${found.join(", ")}`);

// C2 — reading level (Flesch-Kincaid grade). Target 7 or lower; heuristic, so fail only above 8.
const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));
const words = text.match(/[A-Za-z][A-Za-z'’-]*/g) ?? [];
const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/(?:es|ed|e)$/, "").match(/[aeiouy]+/g) ?? []).length);
if (words.length > 30) {
  const grade = 0.39 * (words.length / sentences.length) + 11.8 * (words.reduce((n, w) => n + syllables(w), 0) / words.length) - 15.59;
  const g = grade.toFixed(1);
  if (grade > 8) fail("C2", `reading level is grade ${g}; target is 7 or lower`);
  else if (grade > 7) warnings.push(`C2 reading level is grade ${g}; target is 7 or lower`);
  else console.log(`ok  C2 reading level grade ${g}`);
}

// L5 — colour contrast of the design tokens in styles.css (WCAG AA: 4.5 for text).
if (css) {
  const root = (css.match(/:root\s*{([^}]*)}/) || [])[1] ?? "";
  const token = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#(?:[0-9a-f]{6}|[0-9a-f]{3}))\b/gi)].map((m) => [m[1], m[2].length === 4 ? "#" + [...m[2].slice(1)].map((c) => c + c).join("") : m[2]]));
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  for (const [fg, bg] of [["text", "bg"], ["muted", "bg"], ["text", "surface"], ["muted", "surface"], ["cta-text", "cta-bg"], ["accent", "bg"]]) {
    if (!token[fg] || !token[bg]) continue;
    const r = ratio(token[fg], token[bg]);
    if (r < 4.5) fail("L5", `contrast --${fg} on --${bg} is ${r.toFixed(2)}; needs 4.5`);
  }
}

for (const w of warnings) console.log(`warn ${w}`);
for (const f of failures) console.log(`FAIL ${f}`);
console.log(failures.length ? `\n${failures.length} problem(s)${release ? " — not ready to go live" : ""}` : `\npage rules pass${warnings.length ? ` (${warnings.length} warning(s) — these block going live)` : ""}`);
process.exit(failures.length ? 1 : 0);
