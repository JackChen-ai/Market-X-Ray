# 安全部署指南：Market X-Ray

## ⚠️ Wrangler 4 重要更新

**如果你使用的是 Wrangler 4.x（全局版本 4.56.0）：**

1. **`wrangler config` 命令已移除** - 不再支持
2. **新的认证方式**：
   - **环境变量**（推荐）：`CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`
   - **OAuth 登录**：`wrangler login`
   - **配置文件**：`wrangler.toml` 中的 `account_id`

3. **项目使用旧版本**：本地项目使用 Wrangler 3.114.16
   - 但全局命令使用 Wrangler 4.56.0
   - 建议统一版本以避免混淆

## 🚨 重要安全提醒

**如果你在对话中看到了任何 API 令牌或凭证：**
1. **立即撤销**泄露的令牌
2. **永远不要**将凭证硬编码在代码中
3. **永远不要**将 `.env` 文件提交到 git
4. 使用环境变量或安全的秘密管理

## 🔐 安全配置步骤

### 步骤 1: 撤销泄露的令牌（立即执行！）

1. 登录 Cloudflare 仪表板：https://dash.cloudflare.com
2. 进入 Profile → API Tokens
3. 找到任何可能泄露的令牌
4. 点击 "..." → "Roll" 或 "Delete"

### 步骤 2: 创建新的安全令牌

1. 在 Cloudflare 仪表板创建新令牌：
   - 模板：**"Edit Cloudflare Workers"**
   - 权限：最小必要权限
   - 账户资源：选择你的账户
   - 区域资源：留空（账户级别权限）

2. **安全保存令牌**：
   - 使用密码管理器（1Password、LastPass 等）
   - 或保存在安全的本地文件
   - **不要**保存在代码、聊天记录或公开位置

### 步骤 3: 设置本地环境

```bash
cd cloudflare-worker

# 1. 安装依赖（包括 dotenv-cli）
npm install

# 2. 创建 .env 文件
npm run env:setup

# 3. 编辑 .env 文件
# 使用你喜欢的编辑器编辑 .env 文件
```

### 步骤 4: 配置 .env 文件

编辑 `.env` 文件（从 `.env.example` 复制）：

```env
# Cloudflare 配置
CLOUDFLARE_API_TOKEN=你的新API令牌
CLOUDFLARE_ACCOUNT_ID=你的账户ID

# Yahoo Finance API 配置
YAHOO_FINANCE_API=https://query1.finance.yahoo.com/v7/finance/options/

# 缓存配置
CACHE_TTL=3600
MAX_RETRIES=3
RETRY_DELAY=1000

# 环境模式
ENVIRONMENT=development  # 开发时用 development，生产用 production
```

### 步骤 5: 验证配置

```bash
# 检查环境变量是否加载
npm run dev

# 测试 API
curl http://localhost:8787/health
curl http://localhost:8787/api/max-pain/AAPL
```

## 🛡️ 安全最佳实践

### 1. 凭证管理
- ✅ **使用环境变量**
- ✅ **使用 .env 文件（gitignored）**
- ✅ **定期轮换令牌**
- ❌ **不要硬编码在代码中**
- ❌ **不要提交到版本控制**
- ❌ **不要分享在聊天记录中**

### 2. 权限最小化
- 只授予必要的权限
- 使用账户级别而非区域级别权限
- 定期审查令牌权限

### 3. 监控和审计
- 启用 Cloudflare 审计日志
- 监控异常的 API 使用
- 设置令牌过期时间

## 🔧 部署流程

### 第一步：统一 Wrangler 版本（重要！）

由于你本地项目和全局的 Wrangler 版本不一致，建议：

#### 选项 A: 升级本地项目到 Wrangler 4（推荐）
```bash
cd cloudflare-worker
npm install --save-dev wrangler@4
# 更新 package.json 中的脚本使用 npx wrangler
```

#### 选项 B: 使用全局 Wrangler 3
```bash
# 降级全局版本
npm uninstall -g wrangler
npm install -g wrangler@3
```

#### 选项 C: 使用 npx 确保版本一致
```bash
# 在 package.json 中更新脚本
# 将 "wrangler" 改为 "npx wrangler"
```

### 开发环境
```bash
# 1. 设置环境变量
npm run env:setup
# 编辑 .env 文件，设置 ENVIRONMENT=development

# 2. 本地开发
npm run dev
# 访问 http://localhost:8787
```

### 生产环境部署
```bash
# 1. 更新 .env 文件
# 设置 ENVIRONMENT=production
# 确保所有生产配置正确

# 2. 同步秘密到 Cloudflare
npm run secrets:sync

# 3. 部署到生产
npm run deploy:prod
```

### 使用 Cloudflare Secrets
```bash
# 手动设置单个秘密
wrangler secret put YAHOO_FINANCE_API

# 批量同步（从 .env 文件）
npm run secrets:sync
```

## 🚨 紧急响应

### 如果凭证泄露：
1. **立即撤销**所有相关令牌
2. **审查日志**查看异常活动
3. **创建新令牌**并更新所有环境
4. **通知相关方**如果涉及用户数据

### 如果 .env 文件意外提交到 git：
```bash
# 1. 从 git 历史中删除
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送到远程
git push origin --force --all

# 3. 更新 .gitignore
# 确保 .env 在 .gitignore 中
```

## 📁 项目安全结构

```
cloudflare-worker/
├── .env                    # 本地环境变量（GITIGNORED）
├── .env.example           # 示例配置（可提交）
├── .gitignore            # 忽略敏感文件
├── SECURE_DEPLOYMENT.md  # 本指南
├── wrangler.toml         # 引用环境变量
└── src/worker.js         # 使用环境变量
```

## 🔍 安全检查清单

- [ ] 所有硬编码凭证已移除
- [ ] `.env` 文件已创建并配置
- [ ] `.env` 在 `.gitignore` 中
- [ ] 泄露的令牌已撤销
- [ ] 新令牌使用最小权限
- [ ] 环境变量在代码中正确引用
- [ ] 生产环境使用 `ENVIRONMENT=production`
- [ ] 有凭证泄露的应急计划

## 📞 支持

### 遇到安全问题？
1. **立即撤销相关令牌**
2. **检查 Cloudflare 审计日志**
3. **联系 Cloudflare 支持**

### 配置问题？
1. 检查 `.env` 文件格式
2. 验证环境变量是否加载：`echo $CLOUDFLARE_API_TOKEN`
3. 查看 wrangler 日志：`wrangler tail`

---

**记住：安全不是功能，而是基础。** 每次部署前都检查这个清单。🔐