# Deployment Guide: Market X-Ray

This guide walks through deploying both the Chrome extension and Cloudflare Worker.

## 🚀 Quick Deployment Checklist

### Phase 1: Cloudflare Worker Setup
- [ ] Create Cloudflare account
- [ ] Install Wrangler CLI
- [ ] Create KV namespace
- [ ] Deploy worker
- [ ] Test API endpoints

### Phase 2: Chrome Extension Setup
- [ ] Update API endpoint URLs
- [ ] Create extension icons
- [ ] Test locally
- [ ] Package for Chrome Web Store
- [ ] Submit for review

## 📦 Cloudflare Worker Deployment

### 1. Prerequisites

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 2. Create KV Namespace

```bash
# Create production namespace
wrangler kv:namespace create "MARKET_X_RAY_CACHE"

# Create preview namespace for development
wrangler kv:namespace create "MARKET_X_RAY_CACHE" --preview
```

Update `wrangler.toml` with the returned IDs:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-production-namespace-id"
preview_id = "your-preview-namespace-id"
```

### 3. Configure Environment Variables

```bash
# Set environment variables
wrangler secret put YAHOO_FINANCE_API
# Enter: https://query1.finance.yahoo.com/v7/finance/options/
```

### 4. Deploy Worker

```bash
cd cloudflare-worker

# Install dependencies
npm install

# Test locally
npm run dev

# Deploy to production
npm run deploy
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl https://market-x-ray-worker.your-username.workers.dev/health

# Test max pain endpoint
curl https://market-x-ray-worker.your-username.workers.dev/api/max-pain/AAPL
```

## 🛠️ Chrome Extension Deployment

### 1. Update Configuration

In `chrome-extension/content.js`, update the API endpoint:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://market-x-ray-worker.your-username.workers.dev/api',
  // ... other config
}
```

### 2. Create Extension Icons

Create three icon sizes in `chrome-extension/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use tools like:
- [Favicon Generator](https://favicon.io/favicon-converter/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### 3. Test Locally

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Visit Twitter/X or Reddit to test

### 4. Package for Chrome Web Store

```bash
# Create ZIP package
cd chrome-extension
zip -r market-x-ray.zip . -x "*.git*" "*.DS_Store"
```

### 5. Submit to Chrome Web Store

1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "Add new item"
3. Upload the ZIP file
4. Fill in store listing details:
   - **Name**: Market X-Ray
   - **Description**: See institutional data (Max Pain) directly on Twitter/Reddit
   - **Category**: Productivity
   - **Screenshots**: Add screenshots of tooltips in action
   - **Privacy Policy**: Link to your privacy policy
5. Submit for review (takes 1-7 days)

## 🔧 Environment Configuration

### Cloudflare Worker Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `YAHOO_FINANCE_API` | Yahoo Finance API endpoint | `https://query1.finance.yahoo.com/v7/finance/options/` |
| `CACHE_TTL` | Cache time-to-live in seconds | `3600` (1 hour) |
| `MAX_RETRIES` | Maximum retry attempts | `3` |
| `RETRY_DELAY` | Delay between retries in ms | `1000` |

### Chrome Extension Configuration

| File | Key | Description |
|------|-----|-------------|
| `content.js` | `API_BASE_URL` | Your Cloudflare Worker URL |
| `content.js` | `DEBOUNCE_DELAY` | DOM scanning debounce delay |
| `content.js` | `WHITELIST_DOMAINS` | Domains where extension activates |

## 🧪 Testing Deployment

### API Endpoints to Test

```bash
# Health check
curl https://your-worker.workers.dev/health

# Max pain for AAPL
curl https://your-worker.workers.dev/api/max-pain/AAPL

# Invalid symbol
curl https://your-worker.workers.dev/api/max-pain/INVALID

# CORS test
curl -X OPTIONS https://your-worker.workers.dev/api/max-pain/AAPL
```

### Chrome Extension Tests

1. **Basic functionality**: Load extension, check popup works
2. **Content script**: Visit Twitter, check console for "Market X-Ray loaded"
3. **Ticker detection**: Post containing `$AAPL` should be detected
4. **Tooltip display**: Hover over `$AAPL`, tooltip should appear
5. **Toggle functionality**: Click extension icon to disable/enable

## 🚨 Troubleshooting

### Common Issues

#### Worker Deployment Fails
```bash
# Check Wrangler version
wrangler --version

# Check login status
wrangler whoami

# Check KV namespace exists
wrangler kv:namespace list
```

#### API Returns 500 Error
1. Check Cloudflare Worker logs in dashboard
2. Verify Yahoo Finance API is accessible
3. Check KV namespace permissions

#### Chrome Extension Not Loading
1. Check `manifest.json` for errors
2. Verify content script matches patterns
3. Check console for CSP errors

#### Tooltips Not Showing
1. Check network tab for API calls
2. Verify CORS headers are set
3. Check if domain is whitelisted

## 📈 Monitoring & Analytics

### Cloudflare Worker Metrics
- **Requests**: Total API calls
- **Errors**: Failed requests
- **Cache hit rate**: Percentage of cached responses
- **Latency**: Response time percentiles

### Chrome Extension Metrics
- **Active users**: Users with extension enabled
- **Tooltip views**: Number of tooltips displayed
- **API calls**: Requests to your worker
- **Error rate**: Failed API calls

## 🔄 Update Process

### Updating Cloudflare Worker
```bash
cd cloudflare-worker
git pull origin main
npm install
npm run deploy
```

### Updating Chrome Extension
1. Make changes in `chrome-extension/`
2. Update version in `manifest.json`
3. Create new ZIP package
4. Upload to Chrome Developer Dashboard
5. Submit for review

## 🛡️ Security Considerations

### API Security
- **CORS**: Only allow necessary origins
- **Rate limiting**: Implement per-IP limits if needed
- **Input validation**: Validate all input parameters

### Extension Security
- **Content Security Policy**: Strict CSP in manifest
- **Permission minimalism**: Request only necessary permissions
- **Code review**: Regular security reviews

### Data Privacy
- **No PII**: Don't collect personally identifiable information
- **Transparency**: Clear privacy policy
- **User control**: Allow users to disable data collection

## 📝 Post-Deployment Checklist

- [ ] Worker deployed and responding to health check
- [ ] API endpoints returning valid JSON
- [ ] CORS headers properly set
- [ ] Chrome extension loads without errors
- [ ] Tooltips display correctly on Twitter/Reddit
- [ ] Popup settings work
- [ ] Error handling graceful
- [ ] Privacy policy linked
- [ ] Analytics tracking implemented (optional)
- [ ] Backup/rollback plan in place

---

*Deployment complete! Your Market X-Ray is now live and ready to provide institutional insights to retail investors.*