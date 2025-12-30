# Market X-Ray

A Chrome extension that shows institutional data (Max Pain) directly on Twitter/Reddit for retail investors.

## 🎯 Project Vision

Bring institutional-grade options data (Max Pain, Option Walls, Gamma Exposure) to retail investors directly in their social media feeds.

## 🏗️ Project Structure

```
Market X-Ray/
├── chrome-extension/          # Chrome extension (Manifest V3)
│   ├── manifest.json         # Extension configuration
│   ├── content.js           # Main content script for Twitter/Reddit
│   ├── background.js        # Background service worker
│   ├── popup.html/js       # Extension popup UI
│   ├── styles.css          # Tooltip styles
│   └── icons/              # Extension icons
├── cloudflare-worker/       # Backend service (Max Pain calculation)
│   ├── src/
│   │   └── worker.js       # Main Cloudflare Worker
│   ├── test/               # Unit tests
│   ├── package.json        # Node.js dependencies
│   └── wrangler.toml       # Cloudflare configuration
├── docs/                   # Project documentation
│   ├── readme.md          # Project overview
│   ├── MARKET_ANALYSIS.md # Market strategy
│   ├── PRD_MVP.md         # Product requirements
│   └── ROADMAP.md         # Development roadmap
└── tests/                  # Integration tests
```

## 🚀 Quick Start

### 1. Chrome Extension Development

```bash
cd chrome-extension

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the chrome-extension folder
```

### 2. Cloudflare Worker Development

```bash
cd cloudflare-worker

# Install dependencies
npm install

# Start local development server
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## 🔧 Technical Stack

### Frontend (Chrome Extension)
- **Manifest V3** - Modern Chrome extension API
- **Vanilla JavaScript** - No frameworks for maximum compatibility
- **Shadow DOM** - Isolated tooltip styling
- **MutationObserver** - Dynamic DOM scanning

### Backend (Cloudflare Worker)
- **Cloudflare Workers** - Serverless edge computing
- **Yahoo Finance API** - Free options chain data
- **KV Storage** - 1-hour caching for rate limiting
- **Max Pain Algorithm** - Real-time calculation

### Key Features Implemented

#### ✅ Phase 1 MVP Complete
- [x] Chrome extension manifest (V3)
- [x] Dynamic ticker detection on Twitter/Reddit
- [x] Yahoo Finance options chain fetching
- [x] Max Pain calculation algorithm
- [x] 1-hour caching with Cloudflare KV
- [x] AI-powered analysis generation
- [x] Beautiful tooltip UI with price vs max pain visualization
- [x] Extension toggle and settings

## 📊 Max Pain Algorithm

The core algorithm calculates the "maximum pain" price where option writers have minimum loss:

```javascript
// For each strike price:
totalPain = Σ |strike - currentPrice| × openInterest

// Find strike with minimum total pain
maxPain = argmin(totalPain)
```

## 🔐 Security & Compliance

- **No affiliate links** - Pure data tooling only
- **Privacy first** - No user tracking
- **CORS enabled** - Secure cross-origin requests
- **Rate limiting** - 1-hour cache to respect Yahoo API
- **Disclaimer** - "Data for reference only" displayed

## 🚦 Development Status

### Current Phase: The Calculator (Month 1-3)
- ✅ Project structure initialized
- ✅ Core algorithms implemented
- ✅ Basic UI components created
- ⏳ Testing and refinement needed
- ⏳ Chrome Web Store submission pending

### Next Steps
1. **Testing** - Unit tests for max pain algorithm
2. **Refinement** - Polish UI/UX based on feedback
3. **Deployment** - Deploy worker, submit to Chrome Web Store
4. **User Testing** - Gather initial user feedback

## 📈 Business Model

### Freemium Strategy
- **Free**: Yesterday's Max Pain (static reference)
- **Pro ($9.9/mo)**: Real-time options flow, Gamma Exposure, AI deep analysis

### Growth Loop
1. Users discover free tool on Twitter/Reddit
2. Find Max Pain data accurate and useful
3. See Pro users sharing advanced insights
4. Upgrade to Pro for real-time advantage

## 🛡️ Risk Management

- **API Rate Limits**: 1-hour caching prevents Yahoo Finance throttling
- **Data Accuracy**: Clear disclaimer about reference-only data
- **User Experience**: Graceful degradation when APIs fail
- **Compliance**: Strict adherence to Chrome Web Store policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool provides financial data for informational purposes only. It is not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.

---

*Built with ❤️ for retail investors who want institutional insights.*