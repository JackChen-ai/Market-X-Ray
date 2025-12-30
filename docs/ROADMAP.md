# Roadmap: Market X-Ray

## Phase 1: The Calculator (Month 1-3) [Current Focus]
* **Goal:** 发布 Chrome 商店，成为市面上唯一能在 Twitter 悬停显示 "Max Pain" 的插件。
* **Tech:** * Cloudflare Worker 实现 Max Pain 算法。
    * Yahoo Finance 免费数据源。
    * DeepSeek V3 基础解读。
* **Monetization:** Free (积累口碑)。

## Phase 2: The Live Feed (Month 4-6)
* **Goal:** 验证付费转化，MRR 突破 $500。
* **Feature:** * 引入付费数据源 (FMP / Alpha Vantage)，支持**盘中每小时更新**。
    * 新增 **Option Volume Spikes (期权爆量)** 监控。
* **Monetization:** 上线 Stripe 支付，推出 Pro Plan ($6.9 Early Bird)。

## Phase 3: The Institution (Month 7-12)
* **Goal:** 护城河构建，MRR 突破 $3,000。
* **Feature:**
    * **Gamma Exposure (GEX):** 计算做市商对冲方向 (算法复杂度高)。
    * **Dark Pool Prints:** 接入暗池数据 API。
* **Expansion:** 适配 Safari (iOS)，让用户在手机上也能用。