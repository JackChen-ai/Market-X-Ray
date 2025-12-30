# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Market X-Ray** is a Chrome extension that shows institutional data (Max Pain) directly on Twitter/Reddit for retail investors. It's a SaaS tool with a freemium business model.

### Architecture Evolution
- **Original**: Chrome extension → Cloudflare Worker → Yahoo Finance API
- **Current (v0.2)**: Chrome extension → Yahoo Finance API → Cloudflare Worker (processing)
- **Key Innovation**: Frontend acts as a "data transporter" using user residential IPs to bypass Yahoo Finance API restrictions

### Key Components
1. **Chrome Extension** (`chrome-extension/`): Detects `$TICKER` patterns on social media, shows tooltips
2. **Cloudflare Worker** (`cloudflare-worker/`): Calculates Max Pain, caches results, serves API endpoints
3. **Testing Page** (`test-extension.html`): Comprehensive testing interface

## Development Commands

### Chrome Extension Development
```bash
# Load extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the chrome-extension folder

# Test with local HTML page
open test-extension.html
```

### Cloudflare Worker Development
```bash
cd cloudflare-worker

# Install dependencies
npm install

# Start local development server
npm run dev  # http://localhost:8787

# Run tests
npm test

# Configure environment (first time)
npm run configure

# Deploy to Cloudflare
npm run deploy          # Development environment
npm run deploy:prod     # Production environment

# Sync secrets to Cloudflare
npm run secrets:sync

# Check Cloudflare login status
npm run whoami
```

### Testing
```bash
# Test API endpoints
curl http://localhost:8787/health
curl http://localhost:8787/api/max-pain/AAPL

# Test new analyze endpoint (for frontend data transport)
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","rawData":{}}'

# Run comprehensive tests in browser
open test-extension.html
```

## Architecture Details

### Data Flow (Current v0.2)
1. User hovers over `$TICKER` on Twitter/Reddit
2. Chrome extension detects ticker via regex `/\$([A-Z]{1,5})\b/g`
3. **Frontend fetches raw options chain directly from Yahoo Finance** using user's residential IP
4. Frontend sends raw data to Cloudflare Worker: `POST /api/analyze`
5. Worker processes raw data, calculates Max Pain using proprietary algorithm
6. Returns JSON with price, max pain, analysis, cache status
7. Extension shows dark-themed tooltip with progress bar visualization

### Max Pain Algorithm (Backend Black Box)
```javascript
// Core calculation in cloudflare-worker/src/worker.js
function calculateMaxPain(options) {
  // Proprietary algorithm - kept secret in backend
  // For each strike price:
  // totalPain = Σ |strike - currentPrice| × openInterest
  // Find strike with minimum total pain
  return strikeWithMinPain;
}
```

### Caching Strategy
- **Cache Key**: `max-pain:${symbol.toUpperCase()}`
- **TTL**: 1 hour (3600 seconds)
- **Fallback**: Mock data when Yahoo Finance API fails
- **Development**: Uses mock data when `ENVIRONMENT=development`

## Configuration Files

### Chrome Extension (`chrome-extension/manifest.json`)
- **Permissions**: `activeTab`, `storage`
- **Host Permissions**: Twitter, X.com, Reddit, Cloudflare Worker, Yahoo Finance
- **Content Scripts**: Runs on social media pages
- **Background Service Worker**: Handles extension lifecycle

### Cloudflare Worker (`cloudflare-worker/wrangler.toml`)
- **Worker Name**: `market-x-ray-worker`
- **KV Namespace**: `CACHE` (id: `5eab9ae376984f21a2ff04319c214d3c`)
- **Account ID**: `ef946fc6ebbb72d3b4214504c394bb3b`
- **Environment Variables**: Loaded via `.env` file

### Environment Variables (`.env`)
```bash
# Required for Cloudflare Worker
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=ef946fc6ebbb72d3b4214504c394bb3b

# Yahoo Finance API (for reference, not used in v0.2)
YAHOO_FINANCE_API=https://query1.finance.yahoo.com/v7/finance/options/

# Cache configuration
CACHE_TTL=3600
MAX_RETRIES=3
RETRY_DELAY=1000

# Environment mode
ENVIRONMENT=development
```

## Key Implementation Files

### Frontend Data Transport (`chrome-extension/content.js`)
- **`fetchMaxPainData(ticker)`**: Frontend fetches Yahoo Finance data directly
- **`createTooltip()`**: Creates dark-themed tooltip with progress bar
- **Event handling**: Debounced DOM scanning with MutationObserver

### Backend Processing (`cloudflare-worker/src/worker.js`)
- **`POST /api/analyze`**: Receives raw Yahoo Finance data, processes it
- **Max Pain calculation**: Proprietary algorithm kept secret
- **AI analysis generation**: Uses DeepSeek API for insights
- **Caching**: KV storage with 1-hour TTL

### Testing Infrastructure (`test-extension.html`)
- Comprehensive API testing interface
- Visual design preview
- Extension installation guide

## Common Development Tasks

### Fixing Tooltip Flickering
The tooltip flickering issue is caused by event listener conflicts. Check:
1. **Event Listener Duplication** in `content.js` - ensure listeners aren't bound multiple times
2. **Mouse Event Conflicts** - hover/leave timing issues
3. **CSS Animation Conflicts** - check `styles.css` for conflicting transitions

### Testing Frontend Data Transport
1. **Check Yahoo Finance permissions**: Ensure `manifest.json` has correct host_permissions
2. **Test raw data fetch**: Open DevTools console, test `fetchMaxPainData('AAPL')`
3. **Verify Worker processing**: Check if `POST /api/analyze` endpoint exists and works
4. **Monitor network requests**: Use DevTools Network tab to see data flow

### Deploying Updates
1. **Update Worker**: `cd cloudflare-worker && npm run deploy`
2. **Update extension**: Reload extension in Chrome
3. **Test end-to-end**: Use `test-extension.html` or visit Twitter/Reddit
4. **Monitor logs**: `cd cloudflare-worker && npx wrangler tail`

## Deployment Checklist

### Before Deployment
1. ✅ Test locally: `npm run dev` and `test-extension.html`
2. ✅ Configure environment: `npm run configure`
3. ✅ Set Cloudflare API token in `.env`
4. ✅ Verify KV namespace exists
5. ✅ Update API endpoints in `content.js` for production

### Production Deployment
```bash
cd cloudflare-worker
npm run deploy:prod
```

### Chrome Web Store Submission
1. Package extension as ZIP
2. Update `manifest.json` version
3. Submit to Chrome Web Store Developer Dashboard
4. Update production API endpoint in `content.js`

## Troubleshooting

### Common Issues
1. **"Could not load icon"**: Ensure `icons/` folder has correct PNG files (16x16, 48x48, 128x128)
2. **CORS errors**: Check CORS headers in Worker response
3. **Yahoo Finance 403**: Frontend should use user IP - check host_permissions
4. **KV namespace not found**: Verify namespace ID in `wrangler.toml`
5. **Tooltip not showing**: Check console for errors, verify API endpoint

### Debug Commands
```bash
# Check Cloudflare Worker logs
cd cloudflare-worker && npx wrangler tail

# Test API endpoints
curl -v http://localhost:8787/api/max-pain/AAPL
curl -X POST http://localhost:8787/api/analyze -H "Content-Type: application/json" -d '{"symbol":"AAPL"}'

# Check Chrome extension errors
# Open DevTools (F12) on Twitter/Reddit page
```

## Project Status

### Current Phase: The Calculator (MVP)
- ✅ Core algorithms implemented
- ✅ Chrome extension UI complete
- ✅ Cloudflare Worker deployed
- ✅ Frontend data transport architecture implemented
- ⚠️ Tooltip flickering fixed
- ⚠️ Real Yahoo Finance data via user IP working

### Next Steps
1. Fix any remaining tooltip issues
2. Test end-to-end data flow
3. Deploy to production
4. Submit to Chrome Web Store
5. Gather user feedback

## Business Model
- **Free**: Yesterday's Max Pain (static reference)
- **Pro ($9.9/mo)**: Real-time options flow, Gamma Exposure, AI deep analysis

---

*For detailed product requirements, see `docs/PRD_MVP.md`. For deployment status, see `DEPLOYMENT_CHECKLIST.md`. For roadmap, see `docs/ROADMAP.md`.*