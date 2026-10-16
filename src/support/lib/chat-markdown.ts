// 聊天回答的安全渲染：先整体转义 HTML，再只生成有限的几种标签（段落、列表、加粗、行内代码、链接）

/** 去掉推理模型输出的思考过程（含未闭合的部分），避免出现在回答里 */
export function cleanAnswer(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .replace(/<details[\s\S]*?<\/details>/gi, '')
    .replace(/<details[\s\S]*$/i, '')
    .trim();
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const link = (href: string, label: string) =>
  href.startsWith('/') ? `<a href="${href}">${label}</a>` : `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

/** 行内格式：输入必须是已转义的文本 */
function inline(s: string): string {
  const slots: string[] = [];
  const keep = (html: string) => `\u0000${slots.push(html) - 1}\u0000`;
  let out = s
    .replace(/`([^`]+)`/g, (_, c: string) => keep(`<code>${c}</code>`))
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/(?!\/))[^\s)]+)\)/g, (_, t: string, u: string) => keep(link(u, t)))
    .replace(/https?:\/\/[^\s<，。；！？、）)]+/g, (u) => keep(link(u, u)))
    .replace(/(?<!\d)(1\d{2}-?\d{4}-?\d{4})(?!\d)/g, (p: string) => keep(`<a href="tel:+86${p.replace(/-/g, '')}">${p}</a>`))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => slots[Number(i)]);
  return out;
}

/** 把一段回答渲染为安全的 HTML */
export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src.replace(/\r\n?/g, '\n')).split('\n');
  const html: string[] = [];
  let para: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) html.push(`<p>${para.map(inline).join('<br>')}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.tag}>${list.items.map((it) => `<li>${inline(it)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const ordered = line.match(/^\d+(?:[.)]\s+|[、）]\s*)(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (!line) {
      flushPara();
      flushList();
    } else if (bullet || ordered) {
      flushPara();
      const tag = bullet ? 'ul' : 'ol';
      if (!list || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push((bullet ?? ordered)![1]);
    } else if (heading) {
      flushPara();
      flushList();
      html.push(`<p><strong>${inline(heading[1])}</strong></p>`);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return html.join('');
}
