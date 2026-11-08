/**
 * Build the principal architect PDF packet from docs/principal-architect/*.md
 * Usage: node scripts/build-architect-packet.mjs
 * Writes HTML to /tmp/architect-packet.html and expects Chrome to print the PDF.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'docs', 'principal-architect');
const files = [
  ['readme', 'README.md', 'Evidence map'],
  ['prd', '01-prd.md', 'PRD'],
  ['roadmap', '02-roadmap.md', 'Roadmap'],
  ['backlog', '03-backlog.md', 'Tickets'],
  ['launch', '04-launch-plan.md', 'Launch plan'],
  ['adr', '05-decision-records.md', 'Decision records'],
  ['architecture', '06-architecture.md', 'Architecture'],
  ['history', '07-release-history.md', 'Release history'],
  ['cost', '08-cost-evidence.md', 'AI cost evidence'],
  ['adoption', '09-adoption.md', 'Adoption and impact'],
  ['validation', '10-validation.md', 'Independent validation'],
];

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  let out = escapeHtml(s);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const local = href.match(/^\.\/([0-9a-z-]+)\.md$/i) || href.match(/^\.\/README\.md$/);
    if (href.startsWith('./')) {
      const id = href.includes('README') ? 'readme'
        : href.match(/01-/) ? 'prd'
        : href.match(/02-/) ? 'roadmap'
        : href.match(/03-/) ? 'backlog'
        : href.match(/04-/) ? 'launch'
        : href.match(/05-/) ? 'adr'
        : href.match(/06-/) ? 'architecture'
        : href.match(/07-/) ? 'history'
        : href.match(/08-/) ? 'cost'
        : href.match(/09-/) ? 'adoption'
        : href.match(/10-/) ? 'validation'
        : '';
      if (id) return `<a href="#${id}">${text}</a>`;
    }
    if (href.startsWith('http')) return `<a href="${escapeHtml(href)}">${text}</a>`;
    return text;
  });
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

function diagram(source) {
  const lines = source.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const kind = lines[0];
  if (kind.startsWith('flowchart')) {
    const nodes = [];
    for (const line of lines.slice(1)) {
      const m = line.match(/^(\w+)\["([^"]+)"\]/);
      if (m) nodes.push(m[2]);
    }
    if (nodes.length <= 3) {
      return `<div class="diagram"><div class="d-row">${nodes.map((n, idx) => `${idx ? '<div class="d-arrow d-side">→</div>' : ''}<div class="d-box">${escapeHtml(n)}</div>`).join('')}</div></div>`;
    }
    const clients = nodes.slice(0, 3);
    const rest = nodes.slice(3);
    return `<div class="diagram">
      <div class="d-row">${clients.map(n => `<div class="d-box">${escapeHtml(n)}</div>`).join('')}</div>
      ${rest.map(n => `<div class="d-arrow">▼</div><div class="d-box d-wide">${escapeHtml(n)}</div>`).join('')}
    </div>`;
  }
  if (kind.startsWith('sequenceDiagram')) {
    const names = {};
    const steps = [];
    for (const line of lines.slice(1)) {
      const who = line.match(/^participant\s+(\w+)\s+as\s+(.+)$/);
      if (who) names[who[1]] = who[2];
      const m = line.match(/^(\w+)->>(\w+):\s*(.+)$/) || line.match(/^(\w+)-->>(\w+):\s*(.+)$/);
      if (m) steps.push(`${names[m[1]] || m[1]} → ${names[m[2]] || m[2]}: ${m[3]}`);
    }
    return `<ul class="num">${steps.map((s, n) => `<li><span class="n">${n + 1}.</span> ${escapeHtml(s)}</li>`).join('')}</ul>`;
  }
  return `<pre class="diagram-src">${escapeHtml(source.trim())}</pre>`;
}

function markdownToHtml(md) {
  const parts = md.split(/```mermaid\n([\s\S]*?)```/g);
  let html = '';
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      html += diagram(part);
      return;
    }
    const lines = part.split('\n');
    let iLine = 0;
    const blocks = [];
    while (iLine < lines.length) {
      const line = lines[iLine];
      if (!line.trim()) { iLine += 1; continue; }
      if (line.startsWith('|')) {
        const rows = [];
        while (iLine < lines.length && lines[iLine].startsWith('|')) {
          rows.push(lines[iLine]);
          iLine += 1;
        }
        const parsed = rows
          .filter(r => !/^\|\s*-+/.test(r))
          .map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        const [head, ...body] = parsed;
        blocks.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
          body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
        }</tbody></table>`);
        continue;
      }
      if (/^[-*] /.test(line)) {
        const items = [];
        while (iLine < lines.length && /^[-*] /.test(lines[iLine])) {
          items.push(lines[iLine].replace(/^[-*] /, ''));
          iLine += 1;
        }
        blocks.push(`<ul>${items.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`);
        continue;
      }
      if (/^\d+\. /.test(line)) {
        const items = [];
        while (iLine < lines.length && /^\d+\. /.test(lines[iLine])) {
          items.push(lines[iLine].replace(/^\d+\. /, ''));
          iLine += 1;
        }
        blocks.push(`<ul class="num">${items.map((item, n) => `<li><span class="n">${n + 1}.</span> ${inline(item)}</li>`).join('')}</ul>`);
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push(`<h3>${inline(line.slice(4))}</h3>`);
        iLine += 1;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(`<h2>${inline(line.slice(3))}</h2>`);
        iLine += 1;
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push(`<h1>${inline(line.slice(2))}</h1>`);
        iLine += 1;
        continue;
      }
      if (line.trim() === '---') {
        iLine += 1;
        continue;
      }
      blocks.push(`<p>${inline(line.trim())}</p>`);
      iLine += 1;
    }
    html += blocks.join('\n');
  });
  return html;
}

const toc = files.map(([id, , label], n) => `<li><a href="#${id}"><span class="n">${n + 1}.</span> ${label}</a></li>`).join('');
const sections = files.map(([id, name]) => {
  const md = readFileSync(join(dir, name), 'utf8');
  const body = markdownToHtml(md).replace('<h1>', `<h1 id="${id}">`);
  return `<section class="doc">${body}</section>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Neo Clouds — Principal Architect Evidence Packet</title>
<style>
  @page { size: letter; margin: 0.7in 0.72in 0.75in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Noto Serif", "Liberation Serif", Georgia, serif;
    color: #1c1915;
    font-size: 11pt;
    line-height: 1.45;
  }
  .cover {
    page-break-after: always;
    min-height: 9.2in;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 0.4in;
  }
  .kicker {
    font-family: "DejaVu Sans", "Noto Sans", sans-serif;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 10pt;
    color: #8a6a12;
    margin: 0 0 12px;
  }
  .cover h1 {
    font-weight: 500;
    font-size: 34pt;
    line-height: 1.05;
    margin: 0 0 14px;
    border: 0;
    page-break-before: auto;
  }
  .cover .sub { font-size: 16pt; margin: 0 0 28px; color: #3d3830; }
  .rule { height: 3px; width: 92px; background: #c4922a; margin: 0 0 22px; }
  .meta { font-family: "DejaVu Sans", sans-serif; font-size: 10.5pt; color: #3d3830; }
  .meta p { margin: 0 0 4px; }
  h1 {
    font-weight: 500;
    font-size: 20pt;
    margin: 0 0 12px;
    page-break-before: always;
    line-height: 1.15;
  }
  h2 { font-size: 13.5pt; margin: 18px 0 8px; font-weight: 600; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 14px 0 6px; font-weight: 600; page-break-after: avoid; }
  p { margin: 0 0 8px; }
  ul, ol { margin: 0 0 10px; padding-left: 1.15em; }
  li { margin: 0 0 3px; }
  a { color: #6b4e0a; text-decoration: none; }
  code {
    font-family: "DejaVu Sans Mono", monospace;
    font-size: 0.86em;
    background: #f4efe4;
    padding: 0 3px;
  }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-family: "DejaVu Sans", sans-serif; font-size: 8.7pt; line-height: 1.35; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #d9d0c2; padding: 4px 6px; vertical-align: top; text-align: left; }
  th { background: #f7f1e4; font-weight: 600; }
  .toc { page-break-after: always; }
  .toc h1 { page-break-before: auto; }
  .toc li { margin: 0 0 8px; font-family: "DejaVu Sans", sans-serif; font-size: 12pt; }
  ul.num { list-style: none; padding-left: 0; }
  ul.num li { padding-left: 2.3em; position: relative; }
  ul.num .n { position: absolute; left: 0; min-width: 2em; }
  .diagram { margin: 8px 0 14px; text-align: center; page-break-inside: avoid; }
  .d-row { display: flex; gap: 8px; justify-content: center; }
  .d-box {
    border: 1px solid #c4922a;
    background: #fffaf0;
    padding: 8px 10px;
    font-family: "DejaVu Sans", sans-serif;
    font-size: 9pt;
    min-width: 120px;
  }
  .d-wide { display: inline-block; min-width: 280px; margin: 0 auto; }
  .d-arrow { color: #8a6a12; font-size: 12pt; line-height: 1.1; }
  .d-side { display: flex; align-items: center; }
  ol.seq { font-family: "DejaVu Sans", sans-serif; font-size: 9.5pt; }
  .doc h1:first-child { margin-top: 0; }
</style>
</head>
<body>
<section class="cover">
  <p class="kicker">Neo Clouds Marketplace</p>
  <div class="rule"></div>
  <h1>Principal architect<br>evidence packet</h1>
  <p class="sub">AI infrastructure. Product ownership, architecture, and the record of what is still unmeasured.</p>
  <div class="meta">
    <p>neocloudsmarketplace.com</p>
    <p>Repository main at 1310d4d</p>
    <p>8 November 2026, Pacific</p>
  </div>
</section>
<section class="toc">
  <h1>Contents</h1>
  <ul class="num toc-list">${toc}</ul>
</section>
${sections}
</body>
</html>`;

const out = '/tmp/architect-packet.html';
writeFileSync(out, html);
console.log(out, html.length);
