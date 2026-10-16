import { describe, expect, it } from 'vitest';
import { cleanAnswer, renderMarkdown } from './chat-markdown';
import { createSseParser } from './dify-client';

describe('Dify 流式事件解析', () => {
  it('跨分片拼接事件，忽略心跳', () => {
    const got: unknown[] = [];
    const feed = createSseParser((e) => got.push(e));
    feed('data: {"event":"message","answer":"您');
    feed('好"}\n\nevent: ping\n\n');
    feed('data: {"event":"message_end"}', true);
    expect(got).toEqual([{ event: 'message', answer: '您好' }, { event: 'message_end' }]);
  });
});

describe('回答渲染', () => {
  it('转义 HTML，不执行脚本', () => {
    const html = renderMarkdown('<script>alert(1)</script> **加粗**');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong>加粗</strong>');
  });

  it('只为 http(s) 与站内路径生成链接', () => {
    expect(renderMarkdown('[测算](/quote)')).toContain('<a href="/quote">测算</a>');
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('<a');
    expect(renderMarkdown('[x](//evil.example)')).not.toContain('<a');
  });

  it('列表与电话号码', () => {
    const html = renderMarkdown('1. 第一步\n2. 第二步\n致电 173-2683-2052');
    expect(html).toContain('<ol><li>第一步</li><li>第二步</li></ol>');
    expect(html).toContain('href="tel:+8617326832052"');
  });

  it('小数开头的行不当作列表', () => {
    expect(renderMarkdown('1.47 倍')).toBe('<p>1.47 倍</p>');
  });

  it('去掉推理过程', () => {
    expect(cleanAnswer('<think>内部推理</think>您好')).toBe('您好');
    expect(cleanAnswer('您好<think>未完')).toBe('您好');
  });
});
