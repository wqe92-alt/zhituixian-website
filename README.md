# 智退险官网（website/）

面向线下服装门店的产品官网。Astro 静态站 + Svelte 交互组件 + Tailwind CSS。报价系数在构建时从上一级素材库 `../model/` 同步，素材库本身不会被修改。

## 常用命令

```bash
npm install          # 首次安装（Node ≥ 22.12）
npm run dev          # 本地开发 http://localhost:4321
npm test             # 报价引擎单元测试
npm run build        # 同步数据 → 构建 dist/ → 样式兼容处理 → 用语扫描（命中则构建失败）
npm run preview      # 预览 dist/
```

`dist/` 可直接放到任意静态托管。部署到子路径时，把 `astro.config.mjs` 里的 `base` 改成 `'/<子路径>/'`。

构建后 `scripts/css-compat.mjs` 会处理手机浏览器兼容：把样式降级到 iOS 15.4 / Chrome 99 也能识别的写法，并为不支持 CSS 分层（`@layer`）的旧内核额外生成 `legacy.*.css`，只有这些浏览器会加载它。手机端（触屏或窄屏）默认关闭纸张颗粒、水彩漂移、滚动淡入和头部模糊，保证滑动流畅。

## 页面

| 页面 | 路径 |
|---|---|
| 首页 | `/` |
| 测算保费 | `/quote` |
| 保障范围（含保险条款全文） | `/coverage` |
| 理赔服务 | `/claims` |
| 价格与优惠 | `/pricing` |
| 常见问题 | `/faq` |
| 关于我们（页脚入口） | `/about` |

旧地址 `/transparency`、`/data-dividend` 跳转到 `/pricing`，`/why` 跳转到首页。

## 常改的内容在哪里

| 内容 | 文件 |
|---|---|
| 保险条款全文 | `src/content/contract.ts` |
| 保障说明、免责条款、数据换利规则（报价页与保障页共用） | `src/content/terms.ts` |
| 常见问题 | `src/content/faq.ts` |
| 影响费率的因素 | `src/content/pricing.ts` |
| 团队名单 | `src/content/team.ts` |
| 测算表单的字段与选项 | `src/lib/factors.ts` |
| 承保机构、销售资质（对外上线前补全，页脚自动显示） | `src/config/site.ts` |

## 在线客服：Dify AI 客服

### 填写密钥（只需改 `website/.env`）

```
PUBLIC_DIFY_API_KEY=app-xxxxxxxx              ← Dify 控制台 → 应用 → 发布 → 访问 API → API 密钥
PUBLIC_DIFY_API_BASE=https://api.dify.ai/v1   ← 云端不用改；自建填 http://<服务器IP>:<端口>/v1
```

改完需要重新运行 `npm run dev` 或 `npm run build`。密钥留空时，“联系顾问”自动改为电话联系弹窗。

注意：静态网站没有后端，构建后密钥会出现在浏览器下载的脚本里，任何访客都能看到并用它调用这个 Dify 应用（消耗额度）。正式上线前建议改为代理：在自己的服务器上转发 Dify 请求并在服务端附加密钥，把 `PUBLIC_DIFY_API_BASE` 设为同源路径（如 `/api/dify`），`PUBLIC_DIFY_API_KEY` 留空即可，前端代码不用改。

### 其他设置（`src/support/support.config.ts` 的 `dify` 段）

- `appMode`：Dify 应用是「聊天助手 / Agent / Chatflow」填 `'chat'`（默认）；是「工作流」填 `'workflow'`，并设置 `workflowInputKey`（开始节点接收问题的变量名）和 `workflowOutputKey`（结束节点输出回答的变量名）。
- `welcome`、`suggestions`：聊天窗的开场白和推荐问题。Dify 应用里设置了“对话开场白”和“开场推荐问题”时，以 Dify 为准。
- `sessionInputKey`：网站每次提问都会把本次对话的编号填进 Dify 开始节点的这个变量（默认 `session_id`）。开始节点如果还有其他必填变量，请改为选填，否则 Dify 会直接结束流程、不返回回答。
- 排查问题：浏览器开发者工具的控制台会打印 Dify 返回的具体原因（以 `[support] Dify 请求失败` 开头）。

### 代码结构

```
src/support/
├─ support.config.ts        ← 客服设置（密钥除外）
├─ index.ts                 ← 对外只有 openSupport()；按钮加 data-open-support 属性即可
├─ types.ts                 ← SupportProvider 适配器接口
├─ providers/index.ts       ← 注册服务商
├─ providers/dify.ts        ← Dify 适配器：按需加载并挂载聊天窗
├─ lib/dify-client.ts       ← Dify 接口：流式回答、停止回复、读取开场白
├─ lib/chat-markdown.ts     ← 回答的安全渲染（先转义，再生成段落、列表、链接）
├─ components/Chat*.svelte  ← 聊天窗界面（标题栏、消息气泡、输入框）
└─ SupportLauncher.astro    ← 右下角悬浮入口 + 电话兜底弹窗
```

- 对话记录保存在当前浏览器标签页（关闭标签页后清空），右上角可以开始新对话；访客标识保存在本机，Dify 日志按访客区分会话。
- 投保申请、报价评估提交后，摘要（门店、联系人、手机号、报价）会作为一条消息发给 AI 客服，可以在 Dify 的“日志与标注”中查看并跟进。
- 换成其他客服工具：在 `providers/` 新建适配器并注册，再改 `support.config.ts` 的 `provider`；`provider: 'none'` 时入口改为电话弹窗。

## 报价引擎

- `src/lib/engine.ts`：月保费 = 当月销售额 × 费率；费率 = 基准费率 × 频率乘数 × 强度乘数；换季月（3、4、9、10 月）叠加季节乘数。主营品类可多选，多选时按各品类等权平均。
- `scripts/sync-model.mjs`：按白名单从 `registry.json`、`rate_manual.csv`、`z_curve.csv`、两份 summaries 生成 `src/data/model.json`（勿手改）。
- 单元测试锁定：示例门店（月销售额 189,890 元的女装店）常规月 1,863 元、费率 0.98%；多选品类等于各品类保费平均；约 3.9% 的因子组合需顾问评估。

## 用语扫描

`scripts/redline-scan.mjs` 在构建后扫描全部页面。出现以下任一情况，构建就会失败：

- 素材库禁用清单里的旧口径。
- 不该给商家看的内部用语，如模型版本、精算术语、项目背景。
- 用"你"而不是"您"。
- 宁波数据没有注明"仅供参考"。

## 需要模型组确认的两处口径

1. **核保检查**：网站按"公司基线取上沿 4%"做保守检查，才能复现"约 3.9% 组合需人工核保"。
2. **换季月计费**：示例门店 1,863 元为常规月口径，换季月按费率手册上调（约 2,740 元/月）。
