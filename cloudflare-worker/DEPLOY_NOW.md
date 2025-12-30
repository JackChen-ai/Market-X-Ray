# 🚀 立即部署：Market X-Ray

## 📋 当前状态
- ✅ Wrangler 4 已安装 (4.56.0)
- ✅ 交互式配置脚本已就绪
- ✅ 安全环境变量系统已配置
- ✅ 本地开发服务器已验证工作

## 🎯 立即执行步骤

### 步骤 1: 运行配置向导
```bash
cd cloudflare-worker
npm run configure
```

**在终端中你会看到：**
```
==========================================
    Market X-Ray 配置向导
==========================================

🔐 步骤 1: Cloudflare 配置
--------------------------
请输入 Cloudflare API 令牌:
```

**按照提示输入：**
1. **Cloudflare API 令牌** - 从 Cloudflare 仪表板获取
2. **Cloudflare 账户 ID** - 你的账户 ID
3. **Yahoo Finance API** - 按回车使用默认值
4. **缓存配置** - 按回车使用默认值
5. **环境模式** - 按回车使用 `development`

### 步骤 2: 验证配置
配置完成后，脚本会自动：
- ✅ 创建 `.env` 文件（gitignored）
- ✅ 测试环境变量加载
- ✅ 测试 Wrangler 连接
- ✅ 显示配置摘要

### 步骤 3: 启动开发服务器
```bash
npm run dev
```
访问：http://localhost:8787

### 步骤 4: 测试 API
```bash
# 在新终端中测试
curl http://localhost:8787/health
curl http://localhost:8787/api/max-pain/AAPL
```

## 🔐 获取 Cloudflare 凭证

### 1. 获取 API 令牌
1. 登录 Cloudflare 仪表板：https://dash.cloudflare.com
2. 点击右上角头像 → "My Profile"
3. 选择 "API Tokens" 标签
4. 点击 "Create Token"
5. 选择模板：**"Edit Cloudflare Workers"**
6. 权限设置：
   - Account: Workers Scripts: Edit
   - Account: Workers KV Storage: Edit
7. 点击 "Continue to summary" → "Create Token"
8. **立即复制令牌**（只显示一次！）

### 2. 获取账户 ID
1. 在 Cloudflare 仪表板首页
2. 查看右侧边栏或 URL 中的账户 ID
3. 或运行：`npx wrangler account list`

## 🛠️ 部署到 Cloudflare

### 开发部署（测试用）
```bash
# 确保 .env 中 ENVIRONMENT=development
npm run deploy
```

### 生产部署
```bash
# 1. 更新 .env 文件
# 设置 ENVIRONMENT=production

# 2. 部署
npm run deploy:prod
```

### 同步秘密到 Cloudflare
```bash
# 将 .env 中的变量同步为 Cloudflare Secrets
npm run secrets:sync
```

## 📱 Chrome 扩展配置

### 更新 API 端点
在 `chrome-extension/content.js` 中：
```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:8787/api', // 开发
  // 或
  API_BASE_URL: 'https://你的-worker.workers.dev/api', // 生产
}
```

### 测试 Chrome 扩展
1. 打开 Chrome → `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `chrome-extension` 文件夹
5. 访问 Twitter/Reddit 测试

## 🚨 紧急安全事项

### 如果看到泄露的令牌：
**立即撤销！** 步骤：
1. 访问 Cloudflare API Tokens 页面
2. 找到令牌 `ziTSFLpy42Q3DzwUDlx4Rm_O8-wZ_BMoZ2RGAgTF`
3. 点击 "..." → "Roll" 或 "Delete"

### 安全最佳实践：
- 🔐 **不要**将 `.env` 提交到 git
- 🔐 **不要**在代码中硬编码凭证
- 🔐 **使用**密码管理器保存令牌
- 🔐 **定期**轮换 API 令牌

## 🔧 故障排除

### 常见问题：

#### "Invalid API Token"
```bash
# 检查令牌权限
npx wrangler whoami

# 重新配置
npm run configure
```

#### "Account ID not found"
```bash
# 列出所有账户
npx wrangler account list

# 更新 .env 文件
```

#### 本地服务器不启动
```bash
# 检查端口占用
lsof -i :8787

# 杀死所有 wrangler 进程
pkill -f wrangler

# 重新启动
npm run dev
```

#### Yahoo Finance API 失败
- 使用模拟数据开发（已内置）
- 考虑备用数据源（Alpha Vantage/FMP）
- 检查网络连接

## 📞 快速参考

### 常用命令
```bash
# 配置
npm run configure

# 开发
npm run dev

# 测试
npm test
curl http://localhost:8787/health

# 部署
npm run deploy          # 开发环境
npm run deploy:prod    # 生产环境

# 管理
npm run secrets:sync   # 同步秘密
npm run login          # OAuth 登录
npm run whoami         # 检查登录状态
```

### 重要文件
```
cloudflare-worker/
├── .env              # 你的凭证（不要提交！）
├── configure.sh      # 配置向导
├── package.json      # 脚本命令
├── wrangler.toml     # Cloudflare 配置
└── src/worker.js     # 主逻辑
```

## 🎉 完成清单

- [ ] 运行 `npm run configure` 输入凭证
- [ ] 测试 `npm run dev` 和 API
- [ ] 部署到 Cloudflare `npm run deploy`
- [ ] 更新 Chrome 扩展 API 端点
- [ ] 测试 Chrome 扩展功能
- [ ] 提交到 Chrome Web Store

---

**现在就开始！运行：**
```bash
cd cloudflare-worker
npm run configure
```

按照终端提示输入你的 Cloudflare 凭证。完成后，你的 Market X-Ray 就准备好部署了！🚀