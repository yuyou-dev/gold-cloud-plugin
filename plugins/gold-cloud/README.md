# Gold Studio cloud connector

公开薄连接器 v0.1.4 beta。仅含 ModelScope OAuth loopback、Gold 工作区配对、远程 MCP 转发与交付下载。无本地首饰算法、业务 schema 或素材库。

开发：`npm ci && npm run build`。入口 `dist/start-mcp.mjs`（stdio MCP）、`dist/cli.mjs connect|status|tools|call`。登录记录位于用户私有 `.gold-cloud`，不要打印或提交该目录。

公开发行包由维护者使用白名单构建，安装说明见仓库根目录 START_HERE.md。连接器及 beta 云端已通过官方 OAuth、浏览器配对、MCP 设计与导出验收。远程 API 使用平台 Authorization 和独立 x-gold-token；下载严格绑定配置 origin，禁止重定向携带凭据。

可选本机 AI 助手：`dist/cli.mjs assistant --enable-local-codex`。仅在用户启用后运行，使用本机 `codex` 登录与订阅；不将登录凭据上传云端。网页原 AI 页创建租约任务，当前工作区连接器执行，服务器只预检建议或登记 PNG，用户点击应用才修改设计。

完整远端MCP工具、resources与prompts动态代理；批量渲染结果通过artifact下载，photoreal由云端原Blender脚本执行。用户明确选定的本机图片/STL/OBJ可通过gold_asset_put的path上传，连接器验证媒体后转为base64，仅发送内容（64MiB上限），不会把本机路径发送到服务器。公网平台的大请求上限仍需部署实测。

大素材沿用 64MiB 上限，UI 与连接器共用顺序分块传输（每块 4MiB），避开平台单请求 32MiB 上限。完成后仍由原服务验证并登记；不修改已有设计。失败会取消临时上传，未完成会话十分钟过期。
