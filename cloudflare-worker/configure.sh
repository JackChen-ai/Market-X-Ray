#!/bin/bash

echo "=========================================="
echo "    Market X-Ray 配置向导"
echo "=========================================="
echo ""

# 检查 .env 文件是否存在
if [ -f ".env" ]; then
    echo "⚠️  发现现有的 .env 文件"
    read -p "是否要覆盖现有配置？(y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "使用现有配置。"
        exit 0
    fi
fi

echo ""
echo "🔐 步骤 1: Cloudflare 配置"
echo "--------------------------"

# 获取 Cloudflare API 令牌
read -p "请输入 Cloudflare API 令牌: " cf_token
while [ -z "$cf_token" ]; do
    read -p "API 令牌不能为空，请重新输入: " cf_token
done

# 获取 Cloudflare 账户 ID
read -p "请输入 Cloudflare 账户 ID: " cf_account_id
while [ -z "$cf_account_id" ]; do
    read -p "账户 ID 不能为空，请重新输入: " cf_account_id
done

echo ""
echo "🌐 步骤 2: Yahoo Finance API 配置"
echo "--------------------------------"

read -p "Yahoo Finance API 端点 [默认: https://query1.finance.yahoo.com/v7/finance/options/]: " yahoo_api
yahoo_api=${yahoo_api:-"https://query1.finance.yahoo.com/v7/finance/options/"}

echo ""
echo "⚙️  步骤 3: 缓存配置"
echo "-------------------"

read -p "缓存时间 (秒) [默认: 3600]: " cache_ttl
cache_ttl=${cache_ttl:-"3600"}

read -p "最大重试次数 [默认: 3]: " max_retries
max_retries=${max_retries:-"3"}

read -p "重试延迟 (毫秒) [默认: 1000]: " retry_delay
retry_delay=${retry_delay:-"1000"}

echo ""
echo "🚀 步骤 4: 环境模式"
echo "------------------"

read -p "环境模式 (development/production) [默认: development]: " environment
environment=${environment:-"development"}

echo ""
echo "📝 生成配置文件..."
echo "------------------"

# 创建 .env 文件
cat > .env << EOF
# Cloudflare 配置
CLOUDFLARE_API_TOKEN=${cf_token}
CLOUDFLARE_ACCOUNT_ID=${cf_account_id}

# Yahoo Finance API 配置
YAHOO_FINANCE_API=${yahoo_api}

# 缓存配置
CACHE_TTL=${cache_ttl}
MAX_RETRIES=${max_retries}
RETRY_DELAY=${retry_delay}

# 环境模式
ENVIRONMENT=${environment}
EOF

echo "✅ .env 文件已创建！"
echo ""

# 显示配置摘要（隐藏敏感信息）
echo "📋 配置摘要:"
echo "----------------------------------------"
echo "Cloudflare 账户 ID: ${cf_account_id}"
echo "Cloudflare API 令牌: ****${cf_token: -4}"
echo "Yahoo Finance API: ${yahoo_api}"
echo "缓存 TTL: ${cache_ttl} 秒"
echo "最大重试: ${max_retries}"
echo "重试延迟: ${retry_delay} 毫秒"
echo "环境模式: ${environment}"
echo "----------------------------------------"
echo ""

# 测试配置
echo "🧪 测试配置..."
echo ""

# 检查环境变量
if source .env 2>/dev/null; then
    echo "✅ 环境变量加载成功"
else
    echo "❌ 环境变量加载失败"
    exit 1
fi

# 测试 Wrangler
echo ""
echo "测试 Wrangler 连接..."
npx wrangler whoami 2>&1 | head -10

echo ""
echo "=========================================="
echo "    配置完成！下一步："
echo "=========================================="
echo ""
echo "1. 启动开发服务器:"
echo "   npm run dev"
echo ""
echo "2. 测试 API:"
echo "   curl http://localhost:8787/health"
echo "   curl http://localhost:8787/api/max-pain/AAPL"
echo ""
echo "3. 部署到 Cloudflare:"
echo "   npm run deploy"
echo ""
echo "⚠️  重要安全提醒:"
echo "   - 不要提交 .env 文件到 git"
echo "   - 定期轮换 API 令牌"
echo "   - 使用密码管理器保存凭证"
echo ""
echo "🔧 故障排除:"
echo "   查看日志: npx wrangler tail"
echo "   重新配置: bash configure.sh"
echo ""