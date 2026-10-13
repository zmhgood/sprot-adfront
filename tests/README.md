# 后台本地浏览器回归

启动本项目 `npm run dev -- --host 127.0.0.1 --port 3107`，随后运行：

```bash
PLAYWRIGHT_PATH=/absolute/path/to/playwright node tests/browser-regression.cjs
```

也可以使用已安装的 `playwright` 模块；脚本使用系统 Chrome。`ADMIN_QA_URL` 可指定其他本地端口，拒绝非 localhost 地址。浏览器独立上下文、合成 token、拦截全部 `/api/` 请求，不读写真实用户、家庭或评论。

检查真实页面内容、用户/评论加载错误、家庭名称搜索、原始创建者与当前管理员区别、评论审核失败的状态保留、窄屏侧栏与 logo、运行时错误。输出 JSON 和截图到系统临时目录 `sport-admin-regression`。这些不证明真实服务器 CRUD 或真机通过；数据库对账另由 backend 集成测试执行。
