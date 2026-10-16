// 构建后扫描 dist/，任何命中都让构建失败：
//  1. 对外口径红线（素材库 README 禁用清单）
//  2. 面向商家的页面不应出现的内部用语，防止汇报口吻回流
//  3. 宁波数字必须同页注明"仅供参考"
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

// [名称, 正则, 范围]：'all' 同时扫 HTML 与 JS；'html' 只扫 HTML 可见文字（避免误伤压缩后的代码标识符）
const RULES = [
  ['宁波旧累计理赔额', /414\s?万/, 'all'],
  ['宁波旧笔均', /448\.9/, 'all'],
  ['旧纠纷率口径', /纠纷率/, 'all'],
  ['旧纠纷降幅', /(降|[−-])\s?38\s?%/, 'all'],
  ['旧复购口径', /复购[^。；，、]{0,6}35\s?%|35\s?%[^。；，、]{0,6}复购/, 'all'],
  ['旧撬动倍数', /撬动?\s?20\s?元/, 'all'],
  ['信用分具体分值', /芝麻|700\s?(分|\+)/, 'all'],
  ['旧七日口径', /七日|七天|(?<![0-9])7\s?(日|天)/, 'all'],
  ['旧免赔 500', /500\s?元?\s?免赔|免赔额?\s?500\s?元/, 'all'],
  ['旧比例免赔', /10\s?%\s?免赔/, 'all'],
  ['旧政策引文', /全面推行线下购物|鼓励金融保险机构/, 'all'],
  ['旧文件年份', /2024\s?[—–-]\s?2026/, 'all'],
  ['旧技术话术', /毫秒/, 'all'],
  ['无支撑对标', /对标国际/, 'all'],
  ['旧折扣表述', /保费减免/, 'all'],
  ['宁波机制称谓', /宁波机制/, 'all'],
  ['内部用语', /冻结|挂牌|草案|口径|锚点|典型店|模拟样本|待核实|参照非承诺|频率率|折损率|承保边界|主张台账|投保意向/, 'all'],
  ['项目背景用语', /大学生|创新创业|大创|项目组|指导教师|保险学院|精算研究院|答辩|评委|红队/, 'all'],
  ['精算术语', /蒙特卡洛|置信区间|σ|§|Bühlmann|Panjer|E\[\(S/, 'all'],
  ['称呼统一为“您”', /你/, 'all'],
  ['内部字段与版本', /registry|rate_manual|dgp_truth|intercept_true|\bv\d+\.\d+\.\d+\b|\bP(50|90|95|99)(\.5)?\b|\bK[1-7]\b/, 'html'],
];

// 图形坐标、样式、链接等属性不是给用户看的文字，扫描前去掉
const NON_TEXT_ATTRS =
  /\s(?:d|cx|cy|r|x|y|x1|x2|y1|y2|width|height|viewBox|points|transform|values|style|fill|stroke|fill-opacity|stroke-opacity|stroke-width|offset|class|srcset|src|href|sizes|data-astro-cid-[\w-]+|props|ssr|client|opts|component-url|renderer-url|before-hydration-url|uid|component-export)="[^"]*"/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (['.html', '.js', '.mjs'].includes(extname(p))) yield p;
  }
}

const SVG_PATH_DATA = /(?:[MLZ]\s?-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?\s?){3,}Z?/g;

const hits = [];
let files = 0;
for (const file of walk(dist)) {
  files++;
  const isHtml = file.endsWith('.html');
  let text = readFileSync(file, 'utf8');
  if (isHtml) text = text.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(NON_TEXT_ATTRS, ' ');
  // 打包进脚本的 SVG 路径坐标（如品牌图标）不是文字
  text = text.replace(SVG_PATH_DATA, ' ');
  for (const [name, re, scope] of RULES) {
    if (scope === 'html' && !isHtml) continue;
    const m = re.exec(text);
    if (m) {
      const at = Math.max(0, m.index - 30);
      hits.push(`${relative(dist, file)}  [${name}]  …${text.slice(at, m.index + m[0].length + 30).replace(/\s+/g, ' ')}…`);
    }
  }
  if (isHtml && /9,224/.test(text) && !/仅供参考/.test(text)) {
    hits.push(`${relative(dist, file)}  [宁波数字缺少"仅供参考"说明]`);
  }
}

if (hits.length) {
  console.error(`[redline] 命中 ${hits.length} 处：\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log(`[redline] 已扫描 ${files} 个文件，未发现禁用口径或内部用语。`);
