// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// 部署到子路径（例如 GitHub Pages 项目站 https://<user>.github.io/<repo>/）时，
// 把 base 改成 '/<repo>/'；站内链接统一经 src/lib/url.ts 拼接，会自动带上 base。
export default defineConfig({
  base: '/',
  // 已合并的旧页面
  redirects: {
    '/transparency': '/pricing',
    '/data-dividend': '/pricing',
    '/why': '/',
  },
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: { enabled: false },
});
