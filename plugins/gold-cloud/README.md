# Gold Studio cloud connector

公开薄连接器 v0.1.1 beta。仅含 ModelScope OAuth loopback、Gold 工作区配对、远程 MCP 转发与交付下载。无本地首饰算法、业务 schema 或素材库。

开发：`npm ci && npm run build`。入口 `dist/start-mcp.mjs`（stdio MCP）、`dist/cli.mjs connect|status|tools|call`。登录记录位于用户私有 `.gold-cloud`，不要打印或提交该目录。

公开发行包由维护者使用白名单构建，安装说明见仓库根目录 START_HERE.md。连接器及 beta 云端已通过官方 OAuth、浏览器配对、MCP 设计与导出验收。远程 API 使用平台 Authorization 和独立 x-gold-token；下载严格绑定配置 origin，禁止重定向携带凭据。
