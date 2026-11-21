// Draws cards/stats.svg and cards/langs.svg from the GitHub API. No third-party service.
// Usage: GITHUB_TOKEN=... node stats.mjs [login]      (in CI the Action's built-in token is enough)
//        node stats.mjs --sample                      (draws from made-up numbers, to check the layout offline)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); const out = join(here, 'cards'); mkdirSync(out, { recursive: true });
const login = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? process.env.GITHUB_REPOSITORY_OWNER ?? 'adhnanjeff';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const C = { bg: '#0d1117', line: '#263041', text: '#e6edf3', muted: '#8b98a9', gold: '#C9A84C' };
const num = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('en-US'));

async function load() {
  if (process.argv.includes('--sample')) return { login, commits: 1072, prs: 41, issues: 12, stars: 23, followers: 18, repos: 31, langs: [['Java', 41, '#b07219'], ['C#', 22, '#178600'], ['Python', 17, '#3572A5'], ['TypeScript', 12, '#3178c6'], ['SQL', 5, '#e38c00'], ['Other', 3, '#8b98a9']] };
  const token = process.env.GITHUB_TOKEN; if (!token) throw new Error('set GITHUB_TOKEN (or use --sample)');
  const query = `query($login:String!){ user(login:$login){ followers{totalCount} pullRequests{totalCount} issues{totalCount}
    contributionsCollection{ totalCommitContributions restrictedContributionsCount }
    repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:STARGAZERS,direction:DESC}){ totalCount nodes{ stargazerCount languages(first:8,orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name color } } } } } } }`;
  const r = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'profile-cards' }, body: JSON.stringify({ query, variables: { login } }) });
  const j = await r.json(); if (!r.ok || j.errors || !j.data?.user) throw new Error(`GitHub API: ${r.status} ${JSON.stringify(j.errors ?? j).slice(0, 300)}`);
  const u = j.data.user; const by = new Map(); let stars = 0;
  for (const repo of u.repositories.nodes) { stars += repo.stargazerCount; for (const e of repo.languages.edges) { const x = by.get(e.node.name) ?? { size: 0, color: e.node.color ?? C.muted }; x.size += e.size; by.set(e.node.name, x); } }
  const all = [...by.entries()].sort((a, b) => b[1].size - a[1].size); const total = all.reduce((t, [, v]) => t + v.size, 0) || 1;
  const top = all.slice(0, 6).map(([name, v]) => [name, Math.round((v.size / total) * 1000) / 10, v.color]);
  return { login, commits: u.contributionsCollection.totalCommitContributions + u.contributionsCollection.restrictedContributionsCount, prs: u.pullRequests.totalCount, issues: u.issues.totalCount, stars, followers: u.followers.totalCount, repos: u.repositories.totalCount, langs: top };
}

const shell = (w, h, title, desc, css, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<style>
  text { font-family: ${SANS}; fill: ${C.text}; }
  .muted { fill: ${C.muted}; }
${css}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="14" fill="${C.bg}" stroke="${C.line}"/>
${body}
</svg>
`;

const d = await load();

// ---- stats
{
  const rows = [['Commits (past year)', d.commits], ['Pull requests', d.prs], ['Issues', d.issues], ['Stars earned', d.stars], ['Followers', d.followers], ['Public repositories', d.repos]];
  const css = `
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .r { animation: rise .6s both; } .t { font-size: 15px; font-weight: 600; fill: ${C.gold}; } .l { font-size: 13px; } .v { font-size: 15px; font-weight: 700; text-anchor: end; }`;
  const body = `<text class="t" x="28" y="38">${esc(d.login)}'s GitHub stats</text>
${rows.map(([l, v], i) => `<g class="r" style="animation-delay:${(0.1 + i * 0.08).toFixed(2)}s"><text class="l muted" x="28" y="${72 + i * 26}">${esc(l)}</text><text class="v" x="402" y="${72 + i * 26}">${esc(num(v))}</text></g>`).join('\n')}`;
  writeFileSync(join(out, 'stats.svg'), shell(430, 232, `GitHub stats for ${d.login}`, rows.map(([l, v]) => `${l}: ${v}`).join('. '), css, body));
}

// ---- languages
{
  const css = `
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .t { font-size: 15px; font-weight: 600; fill: ${C.gold}; } .l { font-size: 13px; } .p { font-size: 12px; text-anchor: end; }
  .bar { transform-box: fill-box; transform-origin: left; animation: grow .9s .2s cubic-bezier(.2,.7,.2,1) both; } .r { animation: rise .6s both; }`;
  const W = 374; let x = 28; let bar = ''; const sum = d.langs.reduce((t, [, p]) => t + p, 0) || 1;
  d.langs.forEach(([name, p, color], i) => { const w = Math.max((p / sum) * W, 2); bar += `<rect class="bar" x="${x.toFixed(1)}" y="54" width="${w.toFixed(1)}" height="10" fill="${esc(color)}" style="animation-delay:${(0.2 + i * 0.05).toFixed(2)}s"/>`; x += w; });
  const list = d.langs.map(([name, p, color], i) => { const col = i % 2, row = Math.floor(i / 2); const lx = 28 + col * 190, ly = 98 + row * 28;
    return `<g class="r" style="animation-delay:${(0.3 + i * 0.07).toFixed(2)}s"><circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${esc(color)}"/><text class="l" x="${lx + 18}" y="${ly}">${esc(name)}</text><text class="p muted" x="${lx + 170}" y="${ly}">${p}%</text></g>`; }).join('\n');
  writeFileSync(join(out, 'langs.svg'), shell(430, 200, `Most used languages for ${d.login}`, d.langs.map(([n, p]) => `${n} ${p}%`).join(', '), css, `<text class="t" x="28" y="34">Most used languages</text>${bar}\n${list}`));
}
console.log(`wrote cards/stats.svg and cards/langs.svg for ${d.login}`);
