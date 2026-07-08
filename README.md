# jsonRender

一个零依赖 Node 项目：填写标题、名字、手机号、邮箱、备注，并自定义 JSON 卡片工具栏符号/emoji，生成暗色代码编辑器风格 PNG。

页面底部有独立的“用户创意”建议表单。建议只会单独保存，不会进入 JSON 卡片，也不会出现在 PNG 中。

## 运行

```bash
node server.js
```

打开：

```text
http://localhost:3000
```

如果 3000 端口被占用：

```powershell
$env:PORT=3001; node server.js
```

## GitHub Pages

项目包含 `.github/workflows/pages.yml`。推送到 GitHub 的 `main` 分支后，会自动把 `public/` 发布到 GitHub Pages。

GitHub Pages 是静态托管环境，不会运行 `server.js`。线上 Pages 版本可以预览和下载 PNG，但不能保存名片到 `data/db.json`。用户创意建议通过 [Supabase](https://supabase.com/) 直接写入云端数据库，无需跳转 GitHub Issue。

### 配置 Supabase（用户创意建议）

1. 在 [Supabase](https://supabase.com/) 创建免费项目。
2. 打开 **SQL Editor**，执行仓库中的 `supabase/setup.sql`。这会创建 `ideas` 表，并启用行级安全（RLS）：匿名用户只能插入，只有已登录的管理员能读取。
3. 在 **Project Settings → API** 复制 **Project URL** 和 **anon public** key。
4. 任选一种方式写入前端配置：
   - **GitHub Actions（推荐）**：在仓库 **Settings → Secrets and variables → Actions** 添加 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`，推送后自动注入。
   - **本地填写**：编辑 `public/supabase-config.js`，填入 `url` 和 `anonKey`。

未配置 Supabase 时，本地 `node server.js` 仍会把建议保存到 `data/db.json`。

## 文件

- `server.js`：静态服务和 `/api/cards`、`/api/ideas` 接口
- `public/index.html`：页面结构
- `public/styles.css`：页面样式
- `public/app.js`：Canvas 渲染、emoji 工具栏、下载 PNG、建议提交
- `public/supabase-config.js`：Supabase 连接配置（anon key 可公开，依赖 RLS 保护数据）
- `supabase/setup.sql`：Supabase 建表与 RLS 策略
- `data/db.json`：本地提交记录，已被 `.gitignore` 排除
