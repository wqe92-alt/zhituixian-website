// ┌───────────────────────────────────────────────────────────────────┐
// │  客服接入的唯一配置点                                              │
// │                                                                   │
// │  网站其余部分只认识 src/support/index.ts 导出的 openSupport()，      │
// │  以及按钮上的 data-open-support 属性，从不直接接触任何客服服务商。     │
// │                                                                   │
// │  当前接入：Dify（AI 客服），聊天窗为自建界面。                        │
// │  ★ Dify 的 API 密钥不写在这里，填在 website/.env 的                 │
// │    PUBLIC_DIFY_API_KEY= 后面；密钥留空时，入口自动改为电话联系弹窗。   │
// │                                                                   │
// │  停用在线客服：把下面的 provider 改成 'none'。                        │
// │  新增服务商：在 providers/ 下实现 SupportProvider，并在               │
// │  providers/index.ts 里注册。                                       │
// └───────────────────────────────────────────────────────────────────┘

export const supportConfig = {
  provider: 'dify' as 'dify' | 'none',

  dify: {
    /** API 密钥：在 website/.env 中填写 PUBLIC_DIFY_API_KEY（形如 app-xxxx） */
    apiKey: String(import.meta.env.PUBLIC_DIFY_API_KEY ?? '').trim(),
    /** API 地址：在 website/.env 中填写 PUBLIC_DIFY_API_BASE；未填写时使用 Dify 云端 */
    apiBase: String(import.meta.env.PUBLIC_DIFY_API_BASE ?? '').trim() || 'https://api.dify.ai/v1',
    /**
     * 应用类型：Dify 中为「聊天助手 / Agent / Chatflow（对话流）」时填 'chat'；
     * 为「工作流（Workflow）」时填 'workflow'，并按需修改下面两个变量名。
     */
    appMode: 'chat' as 'chat' | 'workflow',
    /** 仅 workflow 类型：开始节点接收问题的变量名、结束节点输出回答的变量名 */
    workflowInputKey: 'query',
    workflowOutputKey: 'text',
    /**
     * Dify「开始」节点里的会话编号变量名：网站每次提问都会自动填写本次对话的编号。
     * 开始节点没有这个变量时可以留着不动（Dify 会忽略多余的输入）。
     */
    sessionInputKey: 'session_id',
    /** 聊天窗标题 */
    assistantName: '智退险顾问',
    /** 开场白与推荐问题：Dify 应用里设置了「对话开场白」「开场推荐问题」时，以 Dify 的设置为准 */
    welcome: '您好，欢迎咨询智退险。我可以为您解答保障范围、保费和理赔流程等问题，请问有什么可以帮您？',
    suggestions: ['智退险保什么？', '保费怎么算？', '每月免赔额是什么意思？', '怎么申请理赔？'],
  },

  phone: {
    display: '173-2683-2052',
    tel: '+8617326832052',
  },

  launcherLabel: '联系顾问',

  /** 页面加载后延迟多久再预加载聊天窗（毫秒），不拖慢首屏 */
  loadDelayMs: 3000,

  /** 聊天窗多久没打开就退回电话弹窗（毫秒） */
  openTimeoutMs: 8000,
};
