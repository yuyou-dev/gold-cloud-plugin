---
name: design-workspace
description: 连接 Gold Studio 云端金作工坊，通过服务器 MCP 设计首饰、预览与下载交付文件。
---
先调用 gold_connection_status；未连接时调用 gold_connect，在 Codex 内置浏览器打开 loginUrl。用户自己登录魔搭并确认 OAuth 授权，然后用管理员另行提供的临时 Gold 账号登录工作台，输入 pairingCode 并确认配对。不要读取、索要或打印密码、授权码、令牌和本机 connection.json。临时账号并不等于魔搭账号。

等待时保留同一个 MCP/CLI 进程。遇到 retry_wait 按 retryAt 等待，不重新登录或创建新配对，不自动重放设计写操作。配对完成后 gold_connection_status 必须核验服务器 workspaceId；安装成功不等于已连接。

当前聊天尚未加载新 MCP 时可由代理使用安装器返回的 Node 和 cli 路径运行 connect/status/tools/call；不要求用户复制终端命令。CLI connect 需保持运行直到连接或过期。

连接后 gold_workbench_open 在内置浏览器打开工作台，再 gold_inspect 读取设计及 revision；先 gold_guide 与 gold_catalog 获取服务器当前规则。已有设计修改走 gold_review → gold_transaction（expectedRevision），冲突先重新读取，不覆盖未知修改。用户要求设计时才新建。所有算法、schema 和制造校验留在服务器，不下载或寻找本机 Gold 源码。

渲染只供预览，不替代制造验证。工厂交付以当前修订 validation 与导出检查为准。使用 gold_download_export 根据服务器 artifactId 下载，提供返回的真实本机路径；服务器路径不是用户本机文件。不要发送黑猫品牌素材，不使用本地 Blender 或本地算法绕过云端能力。

网页 AI 助手需要用户启用本机执行：说明会使用当前电脑 Codex 登录与额度后，运行安装器返回的 cli `assistant --enable-local-codex` 并保持进程。关闭进程即可停止。只处理当前已配对工作区的租约任务，不接受云端命令或文件路径；设计建议由服务器预检，用户在原AI页点击应用后才保存。生成图片使用本机Codex内置生图能力；未启用时明确说明，不把不可用算作功能验收通过。
