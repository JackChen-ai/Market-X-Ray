#!/bin/bash
# Market X-Ray 认证测试脚本

echo "=== Market X-Ray 认证测试 ==="
echo ""

# 1. 检查版本
echo "1. 检查 Wrangler 版本:"
echo "   全局版本: $(wrangler --version 2>/dev/null || echo '未安装')"
echo "   本地版本: $(npx wrangler --version 2>/dev/null || echo '未安装')"
echo ""

# 2. 检查登录状态
echo "2. 检查登录状态:"
npx wrangler whoami 2>&1 | head -5
echo ""

# 3. 检查环境变量
echo "3. 检查环境变量:"
if [ -f ".env" ]; then
    echo "   .env 文件存在"
    grep -E "CLOUDFLARE|YAHOO" .env | while read line; do
        echo "   $(echo $line | cut -d'=' -f1)=[已设置]"
    done
else
    echo "   .env 文件不存在"
fi
echo ""

# 4. 建议
echo "=== 建议 ==="
echo ""
echo "选项 A: 使用 OAuth 登录 (推荐)"
echo "  npm run login"
echo ""
echo "选项 B: 使用环境变量"
echo "  1. 撤销泄露的令牌"
echo "  2. 创建新令牌"
echo "  3. 在 .env 文件中设置:"
echo "     CLOUDFLARE_API_TOKEN=你的新令牌"
echo "     CLOUDFLARE_ACCOUNT_ID=你的账户ID"
echo ""
echo "选项 C: 升级到 Wrangler 4"
echo "  npm install --save-dev wrangler@4"
echo ""

echo "=== 立即行动 ==="
echo "1. 立即撤销泄露的令牌!"
echo "2. 选择上述一个选项执行"
echo "3. 运行测试: npm run dev"