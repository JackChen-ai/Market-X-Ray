// Market X-Ray Background Script - 进阶版：Crumb 猎手模式
// 自动偷取 Yahoo Finance 的 Crumb 暗号，绕过双重验证

console.log('Market X-Ray background script loaded (Crumb Hunter Mode)')

// Extension state
const state = {
  isEnabled: true,
  userPreferences: {
    showTooltips: true,
    autoScan: true,
    whitelistedDomains: ['twitter.com', 'x.com', 'reddit.com'],
  },
}

// 缓存 Crumb，避免每次都去偷，提升速度
let cachedCrumb = null
let crumbLastFetched = 0
const CRUMB_CACHE_TTL = 30 * 60 * 1000 // 30分钟缓存

// Load saved preferences
chrome.storage.local.get(['isEnabled', 'userPreferences'], (result) => {
  if (result.isEnabled !== undefined) {
    state.isEnabled = result.isEnabled
  }
  if (result.userPreferences) {
    state.userPreferences = { ...state.userPreferences, ...result.userPreferences }
  }
  console.log('Loaded preferences:', state)
})

// Save preferences to storage
function savePreferences() {
  chrome.storage.local.set({
    isEnabled: state.isEnabled,
    userPreferences: state.userPreferences,
  })
}

// Toggle extension enabled state
function toggleEnabled(enabled) {
  state.isEnabled = enabled

  // Notify all content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_ENABLED',
          enabled: state.isEnabled,
        }).catch(() => {
          // Tab might not have content script loaded
        })
      }
    })
  })

  savePreferences()
  updateBadge()
}

// Update extension badge
function updateBadge() {
  if (state.isEnabled) {
    chrome.action.setBadgeText({ text: 'ON' })
    chrome.action.setBadgeBackgroundColor({ color: '#17bf63' }) // Green
  } else {
    chrome.action.setBadgeText({ text: 'OFF' })
    chrome.action.setBadgeBackgroundColor({ color: '#e0245e' }) // Red
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason)

  if (details.reason === 'install') {
    // Show welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html'),
    })
  }

  updateBadge()
})

// Handle browser action click
chrome.action.onClicked.addListener((tab) => {
  // Toggle enabled state
  toggleEnabled(!state.isEnabled)
})

// 🕵️ 核心功能：从网页源码里提取 Crumb
async function fetchCrumb() {
  try {
    console.log('[Crumb Hunter] 🕵️ Visiting Yahoo webpage to find crumb...')

    // 1. 访问任意一个由 React 渲染的 Yahoo 详情页（比如 Apple 的）
    // 这里的 fetch 会自动带上浏览器的 Cookie
    const response = await fetch('https://finance.yahoo.com/quote/AAPL', {
      credentials: 'include',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Yahoo page: ${response.status}`)
    }

    const text = await response.text()
    console.log('[Crumb Hunter] Yahoo page fetched, searching for crumb...')

    // 2. 使用正则暴力搜索 Crumb
    // Yahoo 通常把 Crumb 藏在类似 "crumb":"AbCdEfGh" 这样的 JSON 字符串里
    const match = text.match(/"crumb":"([A-Za-z0-9\.\-_]+)"/)

    if (match && match[1]) {
      // Unicode 转义处理 (以防 crumb 里有 \u002F 这种东西)
      const rawCrumb = match[1]
      const decodedCrumb = rawCrumb.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )

      console.log(`[Crumb Hunter] ✅ Found crumb: ${decodedCrumb}`)
      crumbLastFetched = Date.now()
      return decodedCrumb
    }

    // 尝试其他可能的模式
    const alternativeMatch = text.match(/"CrumbStore":\s*{\s*"crumb":\s*"([^"]+)"/)
    if (alternativeMatch && alternativeMatch[1]) {
      const decodedCrumb = alternativeMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      console.log(`[Crumb Hunter] ✅ Found crumb (alternative): ${decodedCrumb}`)
      crumbLastFetched = Date.now()
      return decodedCrumb
    }

    console.warn('[Crumb Hunter] Could not regex match "crumb" in HTML.')
    return null

  } catch (error) {
    console.error('[Crumb Hunter] Failed to fetch crumb page:', error)
    return null
  }
}

// 获取有效的 Crumb（带缓存）
async function getValidCrumb() {
  const now = Date.now()

  // 检查缓存是否有效
  if (cachedCrumb && (now - crumbLastFetched) < CRUMB_CACHE_TTL) {
    console.log(`[Crumb Hunter] Using cached crumb: ${cachedCrumb.substring(0, 20)}...`)
    return cachedCrumb
  }

  // 获取新的 Crumb
  console.log('[Crumb Hunter] Cache expired or empty, fetching fresh crumb...')
  const newCrumb = await fetchCrumb()

  if (newCrumb) {
    cachedCrumb = newCrumb
    crumbLastFetched = now
    return newCrumb
  }

  // 如果获取失败，尝试使用备用股票代码
  console.log('[Crumb Hunter] Trying alternative stock for crumb...')
  const fallbackCrumb = await fetchCrumbFromAlternative()

  if (fallbackCrumb) {
    cachedCrumb = fallbackCrumb
    crumbLastFetched = now
    return fallbackCrumb
  }

  throw new Error('Failed to obtain valid crumb from Yahoo Finance')
}

// 备用方法：尝试其他股票页面
async function fetchCrumbFromAlternative() {
  const alternativeStocks = ['MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']

  for (const stock of alternativeStocks) {
    try {
      console.log(`[Crumb Hunter] Trying ${stock} page...`)
      const response = await fetch(`https://finance.yahoo.com/quote/${stock}`, {
        credentials: 'include',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      })

      if (response.ok) {
        const text = await response.text()
        const match = text.match(/"crumb":"([A-Za-z0-9\.\-_]+)"/)

        if (match && match[1]) {
          const decodedCrumb = match[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          )
          console.log(`[Crumb Hunter] ✅ Found crumb from ${stock}: ${decodedCrumb}`)
          return decodedCrumb
        }
      }
    } catch (error) {
      console.warn(`[Crumb Hunter] Failed to fetch ${stock} page:`, error.message)
    }
  }

  return null
}

// 核心数据骡子逻辑：使用 Crumb 获取 Yahoo 数据
async function handleDataMuleWithCrumb(ticker) {
  try {
    console.log(`[Data Mule] 🚀 Starting Crumb Hunter job for ${ticker}...`)

    // 第一步：获取有效的 Crumb
    const crumb = await getValidCrumb()
    if (!crumb) {
      throw new Error('❌ Failed to extract Crumb from Yahoo webpage.')
    }

    console.log(`[Data Mule] 🔑 Using Crumb: ${crumb.substring(0, 30)}...`)

    // 第二步：带着 Crumb 和 Ticker 去请求 API
    // 注意：我们要拼上 &crumb=... 参数
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?formatted=false&lang=en-US&region=US&crumb=${crumb}`

    console.log(`[Data Mule] 📡 Fetching Yahoo API: ${yahooUrl.substring(0, 80)}...`)

    const yahooResp = await fetch(yahooUrl, {
      method: 'GET',
      credentials: 'include', // 必须带上浏览器的 Cookie
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      }
    })

    if (yahooResp.status === 401 || yahooResp.status === 403) {
      // 如果 API 拒绝，说明 Crumb 可能过期了，清除缓存下次重试
      console.log(`[Data Mule] ❌ API refused with status ${yahooResp.status}, clearing crumb cache`)
      cachedCrumb = null
      crumbLastFetched = 0
      throw new Error(`Yahoo API refused: ${yahooResp.status} (Crumb might be invalid)`)
    }

    if (yahooResp.status === 429) {
      console.log(`[Data Mule] ⚠️ Rate limited (429), waiting 5 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      throw new Error('Rate limited by Yahoo Finance')
    }

    if (!yahooResp.ok) {
      throw new Error(`Yahoo API error: ${yahooResp.status} ${yahooResp.statusText}`)
    }

    const yahooJson = await yahooResp.json()
    console.log(`[Data Mule] ✅ Yahoo data fetched successfully`)

    // 第三步：把数据抛给 Worker 计算
    const workerUrl = 'https://market-x-ray-worker-production.chenkaijie02.workers.dev/api/analyze'

    console.log(`[Data Mule] 📦 Sending payload to Worker for calculation...`)

    const workerResp = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        symbol: ticker.toUpperCase(),
        rawData: yahooJson, // 把整个 JSON 传过去
        timestamp: new Date().toISOString()
      })
    })

    if (!workerResp.ok) {
      throw new Error(`Worker calculation failed: ${workerResp.status}`)
    }

    const finalResult = await workerResp.json()
    console.log(`[Data Mule] ✅ Received calculation from Worker:`, {
      symbol: finalResult.symbol,
      price: finalResult.price,
      maxPain: finalResult.maxPain,
      dataSource: finalResult.dataSource
    })

    return { success: true, data: finalResult }

  } catch (error) {
    console.error('[Data Mule] ❌ Error:', error)
    // 遇到特定错误清除缓存，防止死循环
    if (error.message.includes('Crumb might be invalid') || error.message.includes('401') || error.message.includes('403')) {
      cachedCrumb = null
      crumbLastFetched = 0
    }
    return { success: false, error: error.toString() }
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)

  switch (message.type) {
    case 'GET_STATE':
      sendResponse(state)
      break

    case 'TOGGLE_ENABLED':
      toggleEnabled(message.enabled)
      sendResponse({ success: true })
      break

    case 'UPDATE_PREFERENCES':
      state.userPreferences = { ...state.userPreferences, ...message.preferences }
      savePreferences()
      sendResponse({ success: true })
      break

    case 'FETCH_YAHOO_FINANCE_DATA':
      // 使用 Crumb 猎手模式获取数据
      handleDataMuleWithCrumb(message.ticker)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.toString() }))

      return true // Keep message channel open for async response

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// Handle tab updates to inject content scripts on whitelisted domains
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url)
    const isWhitelisted = state.userPreferences.whitelistedDomains.some(domain =>
      url.hostname.includes(domain)
    )

    if (isWhitelisted && state.isEnabled) {
      // Content script should already be injected via manifest.json
      // We just need to notify it
      chrome.tabs.sendMessage(tabId, {
        type: 'TAB_UPDATED',
        url: tab.url,
      }).catch(() => {
        // Content script might not be ready yet
      })
    }
  }
})

// Initialize badge on startup
updateBadge()

console.log('Market X-Ray background script initialized')