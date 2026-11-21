// Generates the profile cards as self-contained SVGs (no scripts, no external fonts, no external requests).
// Run: node build.mjs   ->   cards/*.svg
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'cards'); mkdirSync(out, { recursive: true });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const noEmoji = (s) => s.replace(/[\u{1F300}-\u{1FAFF}⭐✓️]/gu, '').replace(/\s+$/, '');
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const C = { bg: '#0d1117', panel: '#111823', line: '#263041', text: '#e6edf3', muted: '#8b98a9', gold: '#C9A84C', blue: '#6ea8fe' };

const shell = (w, h, title, desc, css, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<style>
  text { font-family: ${SANS}; fill: ${C.text}; }
  .mono { font-family: ${MONO}; }
  .muted { fill: ${C.muted}; }
  .gold { fill: ${C.gold}; }
${css}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="14" fill="${C.bg}" stroke="${C.line}"/>
${body}
</svg>
`;

// ---------------------------------------------------------------- hero
{
  const lines = ["hey, I'm Adhnan Jeff", 'Software engineer, builder, problem solver', 'Shipping ALIBI, a noir murder game', 'Backend by day, game dev by night', 'Tamil Nadu State badminton champion'];
  const step = 3, total = step * lines.length;
  const css = `
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes cyc { 0% { opacity: 0; transform: translateY(8px); } 3% { opacity: 1; transform: none; } 17% { opacity: 1; transform: none; } 20% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 0; } }
  .name { font-size: 46px; font-weight: 700; letter-spacing: -1px; animation: rise .9s cubic-bezier(.2,.7,.2,1) both; }
  .rule { transform-origin: 40px 0; transform-box: fill-box; animation: draw 1s .5s cubic-bezier(.2,.7,.2,1) both; }
  .tag { font-size: 20px; font-weight: 500; opacity: 0; animation: cyc ${total}s infinite; }
  .tag.first { opacity: 1; }
  .kick { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; animation: rise .8s .1s both; }`;
  const body = `<text class="kick mono gold" x="40" y="52">adhnanjeff / github</text>
<text class="name" x="40" y="108">Adhnan Jeff</text>
<rect class="rule" x="40" y="126" width="120" height="3" rx="1.5" fill="${C.gold}"/>
${lines.map((l, i) => `<text class="tag${i === 0 ? ' first' : ''}" x="40" y="168" style="animation-delay:${i * step}s">${esc(l)}</text>`).join('\n')}`;
  writeFileSync(join(out, 'hero.svg'), shell(880, 200, 'Adhnan Jeff', 'Software engineer, builder and problem solver. Currently shipping ALIBI, a noir murder game.', css, body));
}

// ---------------------------------------------------------------- portrait + facts (rows fade in top to bottom)
{
  const raw = readFileSync(join(here, 'src', 'neofetch.txt'), 'utf8').split('\n').filter((l) => l.length);
  const col = raw[0].indexOf('adhnanjeff@github');
  const rows = raw.map((l) => ({ art: l.slice(0, col).replace(/\s+$/, ''), info: noEmoji(l.slice(col)).trim() }));
  const LH = 13, TOP = 34, AX = 36, ARTW = 62 * 6.3, IX = AX + ARTW + 28, H = TOP + rows.length * LH + 30, W = 880;
  const sep = (s) => /^─+$/.test(s);
  const parse = (s) => { const m = s.match(/^(.+?)\s+\.+\s+(.+)$/) ??s.match(/^(\S+)\s{2,}(.+)$/); return m ? { k: m[1].trim(), v: m[2].trim() } : { k: '', v: s }; };
  let art = '', info = '';
  rows.forEach((r, i) => {
    const y = TOP + i * LH, d = (0.25 + i * 0.045).toFixed(3);
    if (r.art) art += `<text class="mono art" xml:space="preserve" x="${AX}" y="${y}" style="animation-delay:${d}s">${esc(r.art)}</text>\n`;
    if (!r.info) return;
    if (sep(r.info)) { info += `<rect class="fade" x="${IX}" y="${y - 7}" width="250" height="1" fill="${C.line}" style="animation-delay:${d}s"/>\n`; return; }
    const { k, v } = parse(r.info);
    if (!k && /@/.test(v)) info += `<text class="mono fade head" x="${IX}" y="${y}" style="animation-delay:${d}s">${esc(v)}</text>\n`;
    else info += `<text class="fade row" x="${IX}" y="${y}" style="animation-delay:${d}s"><tspan class="muted key">${esc(k)}</tspan><tspan x="${IX + 92}">${esc(v)}</tspan></text>\n`;
  });
  const css = `
  @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  .art { font-size: 10.5px; fill: ${C.muted}; animation: fadein .5s both; }
  .fade { animation: fadein .5s both; }
  .head { font-size: 14px; font-weight: 700; fill: ${C.gold}; }
  .row { font-size: 12.5px; }
  .key { font-size: 12.5px; }`;
  writeFileSync(join(out, 'about.svg'), shell(W, H, 'About Adhnan Jeff', 'An ASCII portrait next to a short fact sheet: location, college, languages, stack, internship, certifications and badminton and hackathon wins.', css, art + info));
}

// ---------------------------------------------------------------- project cards
{
  const wrap = (s, n) => { const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };
  const cards = [
    { id: 'alibi', name: 'ALIBI', big: 'Daily', label: 'noir murder mystery', text: 'An AI detective that tracks every word you say.', stack: 'Next.js · Supabase · Claude API' },
    { id: 'vehicle', name: 'Vehicle Security + ETL', big: '99.7%', label: 'attack detection', text: '1000+ CAN messages a second, anomalies flagged in under 100 ms.', stack: 'Python · Kafka · MongoDB · scikit-learn' },
    { id: 'payments', name: 'Split Payment System', big: '70%', label: 'fewer reconciliation errors', text: 'An ACID-compliant ledger for splitting payments.', stack: 'Java · Spring Boot · PostgreSQL' },
    { id: 'academy', name: 'Badminton Academy', big: '200+', label: 'active students', text: 'A full-stack platform for running the academy.', stack: 'Spring Boot · Angular · MySQL · S3' },
  ];
  cards.forEach((c, i) => {
    const css = `
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes pop { 0% { opacity: 0; transform: translateY(12px) scale(.96); } 60% { opacity: 1; transform: translateY(-2px) scale(1.02); } 100% { opacity: 1; transform: none; } }
  .a { animation: rise .7s ${(i * 0.12).toFixed(2)}s cubic-bezier(.2,.7,.2,1) both; }
  .big { font-size: 40px; font-weight: 700; letter-spacing: -1px; fill: ${C.gold}; animation: pop .8s ${(0.2 + i * 0.12).toFixed(2)}s both; }
  .bar { transform-box: fill-box; transform-origin: left; animation: draw .9s ${(0.3 + i * 0.12).toFixed(2)}s cubic-bezier(.2,.7,.2,1) both; }
  .name { font-size: 15px; font-weight: 600; } .lab { font-size: 12.5px; } .txt { font-size: 13px; } .stk { font-size: 11.5px; }`;
    const body = `<g class="a"><text class="name" x="28" y="38">${esc(c.name)}</text></g>
<text class="big" x="28" y="92">${esc(c.big)}</text>
<text class="lab muted a" x="28" y="112">${esc(c.label)}</text>
<rect class="bar" x="28" y="124" width="48" height="3" rx="1.5" fill="${C.gold}"/>
<g class="a">${wrap(c.text, 50).map((l, j) => `<text class="txt" x="28" y="${150 + j * 18}">${esc(l)}</text>`).join('')}</g>
<text class="stk mono muted a" x="28" y="198">${esc(c.stack)}</text>`;
    writeFileSync(join(out, `project-${c.id}.svg`), shell(430, 220, c.name, `${c.name}: ${c.big} ${c.label}. ${c.text} Built with ${c.stack}.`, css, body));
  });
}
console.log('wrote', out);
