import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSite } from '../scripts/build-site.mjs';
import { assertPublicSite, inspectPublicText } from '../scripts/site-content-guard.mjs';

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

test('proteção de publicação recusa exemplos sintéticos e não revela os valores', async () => {
  // Deliberately fake samples, never read credentials or runtime data.
  const samples = [
    ['password="somente-simulacao-123"', 'credential-value'],
    ['senha: "teste-curto"', 'credential-value'],
    ['api_key=' + 'valorSINTETICO'.repeat(3), 'credential-value'],
    ['ghp_' + 'A'.repeat(36), 'provider-token'],
    ['sk-proj-' + 'X'.repeat(35), 'provider-token'],
    ['Bearer ' + 'Z'.repeat(24), 'bearer-token'],
    ['eyJhbGciOiJub25lIn0.' + 'Y'.repeat(12) + '.' + 'Z'.repeat(12), 'jwt'],
    ['-----BEGIN PRIVATE KEY-----\nDADO FICTICIO', 'private-key'],
    ['https://simulacao-inexistente.ngrok-free.dev', 'tunnel-address'],
    ['https://simulacao-inexistente.ts.net', 'tunnel-address'],
    ['https://central-simulada.test-not-allowed.invalid-real', 'unreviewed-address'],
    ['10.251.252.253', 'operational-ip'],
    ['https://[fd00:1234::99]/', 'operational-ipv6'],
    ['contato-simulado@dominio-sintetico.invalid-real', 'personal-email'],
    ['C:/Users/Pessoa-Ficticia/config', 'personal-path'],
    ['https://usuario:senha-ficticia@example.invalid/', 'credential-url'],
    ['GET %2fapi%2fcases', 'real-route'],
    ['senha=&quot;segredo-ficticio&quot;', 'credential-value'],
    [String.raw`GET \u002fapi\u002fcases`, 'real-route']
  ];
  for (const [text, rule] of samples) {
    assert.ok(inspectPublicText(text).includes(rule), 'Regra não detectou amostra sintética: ' + rule);
    const out = await mkdtemp(path.join(os.tmpdir(), 'runavolt-guard-'));
    try {
      await writeFile(path.join(out, 'fixture.html'), '<p>' + text + '</p>');
      await assert.rejects(assertPublicSite(out), error => {
        assert.ok(error.message.includes(rule));
        assert.ok(!error.message.includes(text), 'Diagnóstico não deve imprimir o conteúdo');
        return true;
      });
    } finally { await rm(out, { recursive: true, force: true }); }
  }
  for (const text of [
    'GET /api/exemplo/chamados', '198.51.100.24', '192.0.2.10', '203.0.113.1', '127.0.0.1',
    'https://example.invalid/', 'http://localhost:8080/', 'contato@example.com',
    'senha="<omitido>"', 'token="[redacted]"', 'senha: ${SEGREDO}',
    'Cookie: case_session=<cookie omitido>', 'https://github.com/leodah20/whatsapp-report-assistant',
    'https://www.sqlite.org/wal.html'
  ]) assert.deepEqual(inspectPublicText(text), [], 'Exemplo seguro foi recusado');
});

function assertInternalLinksExist(file, html) {
  const root = path.resolve(path.dirname(file));
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
    if (!clean) continue;
    let target = path.resolve(root, clean);
    if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, 'index.html');
    assert.ok(existsSync(target), `${path.basename(file)} aponta para ${href}, que não existe`);
  }
}

test('gera o site público de arquitetura e estudos sem dados operacionais', async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'runavolt-site-'));
  try {
    const result = await buildSite({ outDir });
    await assertPublicSite(outDir);
    assert.equal(result.chapters, 13);
    assert.equal(result.pages, result.chapters + 3);

    const files = walk(outDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    assert.equal(htmlFiles.length, result.pages);

    for (const required of ['index.html', '404.html', 'estudos/index.html', 'robots.txt', 'sitemap.xml', '.nojekyll']) {
      assert.ok(existsSync(path.join(outDir, required)), `faltou ${required}`);
    }

    const home = readFileSync(path.join(outDir, 'index.html'), 'utf8');
    const studies = readFileSync(path.join(outDir, 'estudos', 'index.html'), 'utf8');
    assert.match(home, /id="arch-tabs"/);
    assert.match(home, /class="hero galaxy"/);
    assert.match(home, /orbit-visual/);
    assert.match(home, /assets\/architecture\.js/);
    assert.match(home, /EXEMPLO ESTÁTICO · DADOS FICTÍCIOS/);
    assert.match(home, /GET \/api\/exemplo\/chamados/);
    assert.match(home, /198\.51\.100\.24/);
    assert.match(home, /https:\/\/github\.com\/leodah20\/runavolt-blog-publico/);
    assert.match(studies, /data-post-search/);
    assert.match(studies, /class="page-hero galaxy"/);
    assert.match(studies, /Ordem recomendada por matéria/);
    assert.equal((studies.match(/class="post-card"/g) || []).length, result.chapters);
    for (const track of ['base', 'produto', 'operacao']) {
      assert.ok(studies.includes(`data-study-track="${track}"`));
      assert.ok(studies.includes(`data-track="${track}"`));
    }

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      assert.doesNotMatch(html, /href="https:\/\/github\.com\/leodah20\/whatsapp-report-assistant(?:[\/#"])/, `${path.basename(file)} aponta para repositório privado`);
      assert.doesNotMatch(html, /\{\{|\}\}/, `${path.basename(file)} manteve placeholder`);
      assert.doesNotMatch(html, /<script[^>]+src="https?:/i, `${path.basename(file)} carrega script externo`);
      assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"[^>]+href="https?:/i, `${path.basename(file)} carrega estilo externo`);
      assert.doesNotMatch(html, /https?:\/\/[^"'\s<>]+\.(?:ngrok-free\.dev|ts\.net)|127\.0\.0\.1:(?:8767|8773|8789)/i);
      assertInternalLinksExist(file, html);
    }

    for (const chapter of readdirSync(path.join(outDir, 'estudos')).filter(file => /^\d{2}-.*\.html$/.test(file))) {
      const html = readFileSync(path.join(outDir, 'estudos', chapter), 'utf8');
      assert.match(html, /class="article-toc"/, `${chapter} sem sumário`);
      assert.match(html, /class="article-nav"/, `${chapter} sem navegação entre capítulos`);
      assert.match(html, /https:\/\/github\.com\/leodah20\/runavolt-blog-publico/, `${chapter} sem link para o blog público`);
    }

    const httpChapter = readFileSync(path.join(outDir, 'estudos', '04-http-apis-e-redes.html'), 'utf8');
    assert.match(httpChapter, /caminhos abaixo são fictícios/);
    assert.match(httpChapter, /language-mermaid/);
    assert.match(httpChapter, /Origem → destino/);
    assert.match(httpChapter, /assets\/vendor\/mermaid\/mermaid\.min\.js/);
    assert.match(httpChapter, /assets\/mermaid-init\.js/);

    const architectureChapter = readFileSync(path.join(outDir, 'estudos', '01-negocio-e-arquitetura.html'), 'utf8');
    assert.match(architectureChapter, /class="diagram"/);
    assert.match(architectureChapter, /class="diagram-source"/);
    assert.doesNotMatch(architectureChapter, /Diagrama Mermaid · acompanhe pela leitura textual/);

    const chapterWithoutDiagram = readFileSync(path.join(outDir, 'estudos', '02-linguagens-e-principios.html'), 'utf8');
    assert.doesNotMatch(chapterWithoutDiagram, /mermaid\.min\.js/);

    assert.ok(existsSync(path.join(outDir, 'assets', 'vendor', 'mermaid', 'mermaid.min.js')));
    assert.ok(existsSync(path.join(outDir, 'assets', 'vendor', 'mermaid', 'LICENSE')));
    assert.ok(existsSync(path.join(outDir, 'assets', 'mermaid-init.js')));
    assert.ok(existsSync(path.join(outDir, 'assets', 'orbit.svg')));

    const architectureScript = readFileSync(path.join(outDir, 'assets', 'architecture.js'), 'utf8');
    const siteScript = readFileSync(path.join(outDir, 'assets', 'site.js'), 'utf8');
    const mermaidInit = readFileSync(path.join(outDir, 'assets', 'mermaid-init.js'), 'utf8');
    assert.doesNotMatch(architectureScript, /\bfetch\s*\(|XMLHttpRequest/);
    for (const file of [...htmlFiles, path.join(outDir, 'assets', 'architecture.js')]) {
      const content = readFileSync(file, 'utf8');
      assert.doesNotMatch(content, /\/api\/(?:cases|status|month|assistant|connect|select|pause|questions|context|history|chat|show)(?=\/|\b)/, `${path.basename(file)} expõe caminho real`);
    }
    assert.match(architectureScript, /Android e HTTPS/);
    assert.match(architectureScript, /Backup e continuidade/);
    assert.doesNotMatch(architectureScript, /(?:ngrok-free\.dev|\.ts\.net|127\.0\.0\.1:\d+)/i);
    assert.doesNotMatch(siteScript, /\bfetch\s*\(|XMLHttpRequest/);
    assert.doesNotMatch(mermaidInit, /\bfetch\s*\(|XMLHttpRequest/);
    assert.doesNotMatch(mermaidInit, /https?:\/\//);

    const sitemap = readFileSync(path.join(outDir, 'sitemap.xml'), 'utf8');
    assert.equal((sitemap.match(/<url>/g) || []).length, result.chapters + 2);
    assert.match(readFileSync(path.join(outDir, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/leodah20\.github\.io\/whatsapp-report-assistant\/sitemap\.xml/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
