# Gold Studio 云端金作工坊：一键连接说明（v0.1.0 beta）

用户可以对 Codex 说：“请按这个 START_HERE 安装并连接 Gold Studio，登录授权由我自己完成。”

你正在帮助受邀用户安装云端薄连接器。自动处理安装与配置，只需简短报告“正在安装 → 等待你登录 → 已连接”。不要索要聊天中的密码、令牌或源码路径。用户只负责浏览器登录和授权。

公开安装版本为 v0.1.0，来源 `https://github.com/yuyou-dev/gold-cloud-plugin`。安装器已发布可用；beta 云端仍在上线验收中，登录或设计服务暂不可用时请如实报告，不能把安装成功称为完成云端验收。这不是 OpenAI 官方公共插件目录。

1. 使用本机 Codex 桌面与内置浏览器；云端无本机回环浏览器环境不支持此登录方式。从管理员确认的公开 v0.1.0 版本下载 scripts/bootstrap.sh（macOS/Linux）或 bootstrap.ps1（Windows），先阅读再执行，遵循宿主安装规则。脚本安装用户目录中的官方 Node.js、必要时官方 Codex CLI，再下载连接器并核验 SHA-256。无需 Gold 核心、Python、Docker、Blender。
2. 安装器幂等保留已有登录和其他 MCP，同名不同来源连接会报告冲突。缺 Git 时由代理通过系统官方软件源处理，不要求设计师复制技术命令。记录安装器返回的 node/cli 路径，不打开 `.gold-cloud/connection.json`。
3. 调用 gold_connect；若本聊天未加载新 MCP，用安装器返回 node 执行 cli connect 并保持进程。在内置浏览器打开返回 loginUrl。用户自行登录魔搭，确认官方 OAuth（公开资料与 API-Inference），平台令牌不进入聊天，连接器不调用模型推理。
4. 回调页提供配对码。打开 https://modelscope.cn/studios/yuyou80/gold-studio-beta-20261018 ，用户使用管理员另行提供的临时 Gold 账号密码登录，输入配对码并确认自己的工作区。不代用户同意授权。浏览器直达地址为 https://yuyou80-gold-studio-beta-20261018.ms.show 。
5. 轮询 gold_connection_status（CLI 自动检查）。429/繁忙时按 retryAt 退避并保留配对，不反复授权、重启进程或重放写操作。连接必须核对真实 workspaceId，再读取服务器 gold_guide、gold_catalog；未成功不要以“已安装”当作“可设计”。
6. 用户要求首饰设计后，gold_workbench_open → gold_inspect → gold_review → gold_transaction（expectedRevision）。单位、约束和制造校验以服务器为准；导出检查通过后才能称为可交付，渲染漂亮不等于可制造。

凭据仅保存于当前用户私有目录，平台 Authorization 与应用 x-gold-token 独立。登录失效、限流或服务停机时明确报告，不改用管理员平台密钥或本地私有算法。公开包只允许远程代理、登录、下载、安装说明和依赖许可证，不包含任何金作工坊私有几何或业务模型实现。
