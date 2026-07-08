# ideas 表新增通知

当 `public.ideas` 插入新行时，通过 Supabase **Database Webhook** 触发通知。

## Telegram（当前推荐）

链路：

```text
ideas INSERT → Database Webhook → notify-new-idea → Telegram Bot API
```

### 1. 设置 Secret（不要提交到 Git）

在 [Edge Function Secrets](https://supabase.com/dashboard/project/tdfpzuewwziofsbmjxdj/functions/secrets) 添加：

| Secret | 说明 |
|--------|------|
| `TELEGRAM_BOT_TOKEN` | @BotFather 提供的 Bot Token |
| `TELEGRAM_CHAT_ID` | 你的 Telegram Chat ID |
| `NOTIFY_CHANNEL` | 填 `telegram`（默认值，可省略） |

### 2. 部署函数

```bash
npx supabase functions deploy notify-new-idea --project-ref tdfpzuewwziofsbmjxdj
```

或在 Dashboard → Edge Functions 创建 `notify-new-idea`，粘贴 `functions/notify-new-idea/index.ts`。

### 3. 创建 Database Webhook

1. 打开 [Database Webhooks](https://supabase.com/dashboard/project/tdfpzuewwziofsbmjxdj/integrations/webhooks/overview)
2. **Create a new hook**
3. 配置：
   - **Name**: `ideas_insert_telegram`
   - **Table**: `public.ideas`
   - **Events**: `INSERT`
   - **Type**: `Supabase Edge Function` → `notify-new-idea`
4. 保存

### 4. 测试

在 https://zhao45332.github.io/jsonRender/ 提交一条「用户创意」，Telegram 应收到通知。

Bot Token 和 Chat ID 只存在 Supabase Secrets，不会出现在前端或公共仓库。

---

## 其他渠道（Slack / Discord）

如需改用 Webhook 渠道，设置：

| Secret | 说明 |
|--------|------|
| `NOTIFY_CHANNEL` | `webhook` |
| `NOTIFY_WEBHOOK_URL` | 机器人 Webhook 地址 |
| `NOTIFY_WEBHOOK_TYPE` | `slack` / `discord` / `generic` |

---

## Supabase 官方能力说明

| 能力 | 用途 |
|------|------|
| [Database Webhooks](https://supabase.com/docs/guides/database/webhooks) | 表变更后发 HTTP 请求 |
| [Edge Functions](https://supabase.com/docs/guides/functions) | 调用 Telegram / 邮件等第三方 API |
| [Realtime](https://supabase.com/docs/guides/realtime) | 仅适合页面内实时刷新，不是手机推送 |

Webhook 调用日志可在数据库 `net` schema 查看。
