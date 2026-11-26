import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { isIP } from 'node:net';

// Heuristic guard for the static publication only. Never inspects the collector.
// Findings contain a rule name, never the matched value or source line.
const RULES = [
  ['real-route', /\/api\/(?:cases|status|month|assistant|connect|select|pause|questions|context|history|chat|show)(?=\/|\b)/i],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/],
  ['provider-token', /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{16,})\b/],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9_~+/.=-]{12,}/i],
  ['jwt', /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ['tunnel-address', /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ngrok-free\.dev|ngrok\.io|ts\.net)\b/i],
  ['personal-path', /(?:[A-Z]:[\\/]Users[\\/]|\/home\/|\/Users\/)[^\s<>]+/i],
  ['credential-url', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@/i]
];
// Explicit public references; new destinations require review, not automatic trust.
const PUBLIC_HOSTS = new Set([
  'developer.mozilla.org', 'docs.ollama.com', 'docs.python.org', 'git-scm.com',
  'github.com', 'learn.microsoft.com', 'leodah20.github.io', 'modelcontextprotocol.io',
  'ngrok.com', 'nodejs.org', 'openai.com', 'owasp.org', 'platform.openai.com',
  'scripts.sil.org', 'www.sitemaps.org', 'www.sqlite.org', 'www.w3.org'
]);

function decodeText(value) {
  let text = String(value);
  // Decode ordinary HTML/URL escapes so escaped examples cannot hide a match.
  for (let i = 0; i < 2; i++) {
    text = text.replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, n) => {
      const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }).replace(/&(?:quot|apos|amp|lt|gt);/g, entity =>
      ({'&quot;':'"', '&apos;':"'", '&amp;':'&', '&lt;':'<', '&gt;':'>'})[entity]);
    text = text.replace(/%[0-9a-f]{2}/gi, c => String.fromCharCode(parseInt(c.slice(1), 16)));
    text = text.replace(/\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi, (_, a, b) => String.fromCharCode(parseInt(a || b, 16)));
  }
  return text.replace(/\\\//g, '/');
}

function placeholder(value) {
  return /^(?:<[^>]+>|\[[^\]]+\]|\$\{[^}]+\}|\*{3,}|x{3,}|omitido|redacted|placeholder)$/i.test(value);
}

export function inspectPublicText(content) {
  const text = decodeText(content);
  const findings = new Set(RULES.filter(([, rule]) => rule.test(text)).map(([id]) => id));
  const assignments = /\b(?:password|passwd|senha|authtoken|api[_-]?key|access[_-]?token|client[_-]?secret|token)\b["']?\s*[:=]\s*(?:["']([^"'\r\n]+)["']|([^\s,;<>]+))/gi;
  for (const m of text.matchAll(assignments)) {
    const value = (m[1] || m[2] || '').trim();
    if (value && !placeholder(value)) findings.add('credential-value');
  }
  for (const m of text.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)) {
    const ip = m[0];
    if (isIP(ip) !== 4) continue;
    // Only loopback and RFC 5737 documentation addresses are accepted.
    if (!/^(?:127\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/.test(ip)) findings.add('operational-ip');
  }
  for (const m of text.matchAll(/\[([0-9a-f:]+)\]/gi)) {
    if (isIP(m[1]) === 6 && m[1] !== '::1' && !/^2001:db8:/i.test(m[1])) findings.add('operational-ipv6');
  }
  for (const m of text.matchAll(/\b[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z][a-z0-9-]*)\b/gi)) {
    if (!/^(?:g\.us|example\.(?:com|org|net)|(?:.*\.)?(?:invalid|example|test))$/i.test(m[1])) findings.add('personal-email');
  }
  for (const m of text.matchAll(/https?:\/\/[^\s"'<>\\)\x60]+/gi)) {
    try {
      const url = new URL(m[0]);
      const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
      const exampleHost = /^(?:localhost|127\.0\.0\.1|::1|(?:.*\.)?example\.(?:com|org|net)|(?:.*\.)?(?:invalid|example|test))$/.test(host);
      if (!exampleHost && !PUBLIC_HOSTS.has(host)) findings.add('unreviewed-address');
    } catch { findings.add('invalid-address'); }
  }
  return [...findings];
}

export async function assertPublicSite(directory) {
  const root = path.resolve(directory);
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Publicação recusada: symlink');
      if (entry.isDirectory()) { await visit(file); continue; }
      if (/(?:^\.env(?:\.|$)|\.(?:sqlite(?:3)?|db|pem|key|pfx|p12|log|har|pcap|zip)$)/i.test(entry.name)) {
        throw new Error('Publicação recusada: arquivo operacional');
      }
      // Vendor code is immutable third-party data, not authored documentation.
      // Binary images/fonts cannot be checked for visible text by this guard.
      const relative = path.relative(root, file).replaceAll('\\', '/');
      if (relative.startsWith('assets/vendor/')) continue;
      if (!/\.(?:html?|js|mjs|css|svg|json|map|txt|xml|md|ya?ml)$/i.test(entry.name)) continue;
      const findings = inspectPublicText(await readFile(file, 'utf8'));
      if (findings.length) throw new Error('Publicação recusada: ' + findings.join(', '));
    }
  }
  await visit(root);
}
