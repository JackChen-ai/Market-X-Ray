# Project: Market X-Ray (SaaS Edition)

## 1. 项目定义
Market X-Ray 是一款面向美股散户的 Chrome 浏览器插件。它将通常只有机构终端（如 Bloomberg）才具备的高阶数据——**最大痛点 (Max Pain)**、**期权墙 (Option Walls)**、**资金流向**——直接“降维打击”到用户的社交媒体信息流中。

## 2. 核心价值 (Value Proposition)
* **Contextual Data (场景化数据):** 在用户浏览 Twitter/Reddit 看到股票代码时，无需切换窗口，直接展示该标的的**机构筹码分布**。
* **Institutional Edge (机构视角):** 散户看 K 线，机构看期权。我们帮助散户看到“做市商(Market Maker)”的防守位。
* **Logic over Hype (逻辑大于情绪):** 利用 AI 解读冷冰冰的期权数据，对抗社交媒体上的 FOMO 情绪。

## 3. 商业模式 (SaaS)
* **Freemium:** * 免费版: 查看昨日收盘计算的 Max Pain (静态参考)。
    * Pro 版 ($9.9/mo): 查看盘中实时期权异动、更精准的 Gamma Exposure 数据、以及 AI 深度策略分析。

## 4. 技术哲学
* **Privacy First:** 不追踪用户隐私，不通过 Affiliate 链接获利。
* **Serverless:** 重计算逻辑（如 Max Pain 算法）后置于 Cloudflare Workers，保持前端轻量。
* **Compliance:** 严格遵守 Web Store "Productivity" 类目规范，不提供直接交易入口。