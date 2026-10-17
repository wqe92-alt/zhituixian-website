// 构建后处理：手机浏览器样式兼容（npm run build 自动执行，作用于 dist/）
//
// Tailwind 4 产出的 CSS 只面向 Safari 16.4+/Chrome 111+，在仍有不少用户的旧内核上会失效：
// 1. 所有样式（外链与内联 <style>）原地降级：媒体查询区间语法 (width>=…) 改写为 min-width、
//    补齐 -webkit- 前缀、为新色彩语法加回退。覆盖支持 @layer 的内核（Chrome 99+、iOS 15.4+）。
// 2. 不支持 @layer 的内核（Chrome < 99、iOS < 15.4，常见于部分国产手机浏览器）会丢弃全部分层样式，
//    页面几乎无排版。为此按页面的样式组合生成一份展开层级的 legacy 样式表，
//    仅在这些浏览器里通过 document.write 加载，现代浏览器不会下载。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import postcss from 'postcss';
import cascadeLayers from '@csstools/postcss-cascade-layers';
import { transform } from 'lightningcss';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const BASE = (process.env.SITE_BASE || '/').replace(/\/?$/, '/');

const v = (major, minor = 0) => (major << 16) | (minor << 8);
const LAYER_TARGETS = {
  chrome: v(99), android: v(99), edge: v(99), samsung: v(18), firefox: v(97), safari: v(15, 4), ios_saf: v(15, 4),
};
const LEGACY_TARGETS = {
  chrome: v(69), android: v(69), edge: v(79), samsung: v(10), firefox: v(66), safari: v(12, 1), ios_saf: v(12, 2),
};

const lower = (code, targets, filename) =>
  transform({ filename, code: Buffer.from(code), minify: true, targets, errorRecovery: true }).code.toString();

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );

const files = walk(DIST);
const isLegacy = (f) => /[\\/]legacy\.[0-9a-f]{8}\.css$/.test(f);

for (const f of files.filter((f) => f.endsWith('.css') && !isLegacy(f))) {
  writeFileSync(f, lower(readFileSync(f, 'utf8'), LAYER_TARGETS, f));
}

const STYLE_TAG = /<link\b[^>]*\brel="stylesheet"[^>]*>|(<style\b[^>]*>)([\s\S]*?)<\/style>/g;
const bundles = new Map();
let pages = 0;

for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  const headEnd = html.indexOf('</head>');
  if (headEnd < 0 || html.includes('CSSLayerBlockRule')) continue;

  const sources = [];
  const head = html.slice(0, headEnd).replace(STYLE_TAG, (tag, open, inline) => {
    if (open) {
      const css = lower(inline, LAYER_TARGETS, f);
      sources.push(css);
      return `${open}${css}</style>`;
    }
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    if (href?.startsWith(BASE)) sources.push(readFileSync(join(DIST, href.slice(BASE.length)), 'utf8'));
    return tag;
  });
  if (!sources.length) continue;

  const combined = sources.join('\n');
  const key = createHash('sha256').update(combined).digest('hex').slice(0, 8);
  if (!bundles.has(key)) {
    const flat = postcss([cascadeLayers()]).process(combined, { from: undefined }).css;
    writeFileSync(join(DIST, '_astro', `legacy.${key}.css`), lower(flat, LEGACY_TARGETS, `legacy.${key}.css`));
    bundles.set(key, `${BASE}_astro/legacy.${key}.css`);
  }
  const loader = `<script>window.CSSLayerBlockRule||document.write('<link rel="stylesheet" href="${bundles.get(key)}">')</script>`;
  writeFileSync(f, head + loader + html.slice(headEnd));
  pages++;
}

console.log(`[css-compat] 已降级 CSS；为 ${pages} 个页面生成 ${bundles.size} 份旧内核样式表`);
