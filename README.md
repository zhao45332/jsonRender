# jsonRender

一个零依赖 Node 项目：用户填写标题、名字、手机号、邮箱、备注，并自定义工具栏符号/emoji 后，后端保存到 `data/db.json`，前端按暗色 JSON 编辑器卡片样式渲染预览，并支持下载 PNG。页面底部另有“用户创意”建议表单，建议会单独保存，不会进入 JSON 卡片。

PNG 只包含 JSON 卡片本身；正文第一行会以 `# 标题` 的注释格式展示，JSON 内容由 `JSON.stringify(data, null, 2)` 生成后再做代码高亮渲染。字段最多 5000 字符，长字段会在卡片内自动换行。

## 运行

```bash
node server.js
```

打开：

```text
http://localhost:3000
```

## GitHub Pages

这个项目已经包含 `.github/workflows/pages.yml`，推送到 GitHub 的 `main` 分支后会自动把 `public/` 发布到 GitHub Pages。

GitHub Pages 是静态托管环境，不会运行 `server.js`，所以线上 Pages 版本可以预览和下载 PNG，但不能保存到 `data/db.json`，用户创意建议也不会被服务器保存。需要保存建议和记录时，请运行 Node 后端或部署到支持 Node 的平台。

如果 3000 端口被占用：

```bash
$env:PORT=3001; node server.js
```

## 文件

- `server.js`：静态服务和 `/api/cards` 接口
- `public/index.html`：页面结构
- `public/styles.css`：表单和预览页面样式
- `public/app.js`：提交、读取记录、Canvas 渲染和下载 PNG
- `data/db.json`：提交记录
