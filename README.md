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

GitHub Pages 是静态托管环境，不会运行 `server.js`。线上 Pages 版本可以预览和下载 PNG，但不能保存到 `data/db.json`，用户创意建议也不会被服务器保存。需要保存建议和记录时，请运行 Node 后端或部署到支持 Node 的平台。

## 文件

- `server.js`：静态服务和 `/api/cards`、`/api/ideas` 接口
- `public/index.html`：页面结构
- `public/styles.css`：页面样式
- `public/app.js`：Canvas 渲染、emoji 工具栏、下载 PNG、建议提交
- `data/db.json`：本地提交记录，已被 `.gitignore` 排除
