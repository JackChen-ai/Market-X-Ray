# MVP Product Requirement Document: Market X-Ray v0.1 (SaaS)

## 1. 核心交互流程 (The Loop)
1.  **Scan:** 监听 Twitter/Reddit，动态识别 `$TICKER`。
2.  **Fetch & Calculate:** * 插件请求 Cloudflare Worker。
    * Worker 拉取 Yahoo Finance Option Chain (期权链) 数据。
    * **Worker 实时计算本周五到期的 "Max Pain" 价格。**
3.  **Analyze:** AI 结合推特上下文 + Max Pain 数据，生成分析。
4.  **Display:** 悬浮卡片展示 "Price vs Max Pain" 对比图。

## 2. 功能需求详情

### P0: 动态扫描与去噪
* **MutationObserver:** 监听 DOM 变化 (防抖 500ms)。
* **Whitelist:** 仅在 `twitter.com`, `x.com`, `reddit.com` 激活。
* **Regex:** 仅匹配 `$TICKER` 格式，避免匹配普通单词。

### P0: 核心数据逻辑 (The Engine - Cloudflare Worker)
* **Source:** Yahoo Finance Unofficial API (Option Chain Endpoint).
* **Algorithm (Max Pain):** * 遍历当前最近到期日 (Nearest Expiration) 的所有 Strike Price。
    * 计算公式: `Sum(Abs(Strike - Underlying) * OpenInterest)` for both Calls and Puts.
    * 找出总损失最小的 Strike Price 作为 **Max Pain**。
* **Caching:** Worker 端缓存结果 1 小时 (降低 Yahoo 请求频率，因为 Max Pain 日内变化不大)。

### P0: AI 分析引擎 (The Analyst)
* **Role:** Institutional Data Interpreter.
* **Input:** Price, Max Pain, Tweet Content.
* **Logic:**
    * 若 Price >> Max Pain: "Price is over-extended. Market Makers have incentive to push it down to [Max Pain]."
    * 若 Price << Max Pain: "Price is suppressed. Potential rebound to [Max Pain] by Friday."
    * 若 Price ≈ Max Pain: "Price is pinned. Low volatility expected."

### P0: 悬浮卡片 UI (The Face)
* **Header:** 代码 | 现价 (延迟) | 涨跌幅。
* **Data Core (重点):** * 展示一个简单的进度条或仪表盘：**Current Price vs Max Pain**。
    * 如果差距过大，用**黄色/红色**高亮示警。
* **AI Insight:** 简短的一句分析 (e.g., "做市商磁吸效应显著，追高需谨慎").
* **Upgrade Trigger:** * 灰色按钮: "Real-time GEX (Pro Only)".

## 3. 技术栈
* **Frontend:** Vanilla JS + Shadow DOM (Manifest V3).
* **Backend:** Cloudflare Workers (Node.js environment compatibility).
* **AI:** DeepSeek V3 API (Cost-effective).

## 4. 风险控制
* **Yahoo API Rate Limit:** Worker 端必须做缓存 (KV Storage)，避免每个用户悬停都触发一次 Yahoo 请求。
* **Disclaimer:** 卡片底部必须注明 "Data for reference only. Not financial advice."