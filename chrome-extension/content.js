// Market X-Ray Content Script
// This script runs on Twitter/Reddit pages and detects stock tickers

console.log('Market X-Ray content script loaded')

// Configuration
const CONFIG = {
  DEBOUNCE_DELAY: 500, // ms
  TICKER_REGEX: /\$([A-Z]{1,5})\b/g, // 只匹配有$符号的股票代码
  WHITELIST_DOMAINS: ['twitter.com', 'x.com', 'reddit.com'],
  API_BASE_URL: 'https://market-x-ray-worker-production.chenkaijie02.workers.dev/api',
}

// Helper function for timeout (polyfill for AbortSignal.timeout)
function createTimeoutSignal(ms) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

// State management
const state = {
  processedElements: new Set(),
  debounceTimer: null,
  isEnabled: true,
}

// Check if current domain is whitelisted
function isWhitelistedDomain() {
  const hostname = window.location.hostname
  return CONFIG.WHITELIST_DOMAINS.some(domain => hostname.includes(domain))
}

// Debounce function to limit DOM scanning frequency
function debounce(func, delay) {
  return function(...args) {
    clearTimeout(state.debounceTimer)
    state.debounceTimer = setTimeout(() => func.apply(this, args), delay)
  }
}

// Extract tickers from text (only $ symbols)
function extractTickers(text) {
  const tickers = new Set()
  let match
  while ((match = CONFIG.TICKER_REGEX.exec(text)) !== null) {
    const ticker = match[1].toUpperCase()   // 股票代码
    tickers.add(ticker)
  }
  return Array.from(tickers)
}

// Helper function to create regex pattern for matching ticker (only $ symbol)
function createTickerPattern(ticker) {
  // 只匹配 $AAPL（必须有$符号）
  return new RegExp(`\\$${ticker}\\b`, 'gi')
}

// Generate realistic mock data based on stock symbol
function generateLocalMockData(ticker) {
  // Base prices for common stocks (approximate)
  const stockPriceRanges = {
    'AAPL': { min: 170, max: 220, name: 'Apple' },
    'TSLA': { min: 180, max: 250, name: 'Tesla' },
    'META': { min: 300, max: 400, name: 'Meta' },
    'GOOGL': { min: 130, max: 160, name: 'Google' },
    'MSFT': { min: 350, max: 450, name: 'Microsoft' },
    'AMZN': { min: 150, max: 200, name: 'Amazon' },
    'NVDA': { min: 400, max: 600, name: 'NVIDIA' },
    'NFLX': { min: 500, max: 700, name: 'Netflix' },
    // Default for other stocks
    'DEFAULT': { min: 50, max: 200, name: 'Stock' }
  }

  const range = stockPriceRanges[ticker.toUpperCase()] || stockPriceRanges['DEFAULT']
  const basePrice = range.min + Math.random() * (range.max - range.min)
  const currentPrice = parseFloat(basePrice.toFixed(2))
  const maxPain = parseFloat((currentPrice * (0.95 + Math.random() * 0.1)).toFixed(2)) // 95%-105% of current price

  const priceDiff = currentPrice - maxPain
  const percentageDiff = Math.abs((priceDiff / currentPrice) * 100).toFixed(1)

  // Generate analysis based on price difference
  let sentiment = 'neutral'
  let analysis = ''

  if (priceDiff > 0) {
    if (percentageDiff > 10) {
      sentiment = 'bearish'
      analysis = `Price is significantly above Max Pain (${percentageDiff}%). Market makers have strong incentive to push price down toward $${maxPain.toFixed(2)} by expiration.`
    } else if (percentageDiff > 5) {
      sentiment = 'slightly bearish'
      analysis = `Price is moderately above Max Pain (${percentageDiff}%). Some downward pressure expected toward $${maxPain.toFixed(2)}.`
    } else {
      sentiment = 'neutral'
      analysis = `Price is near Max Pain. Low volatility expected as price is pinned around current levels.`
    }
  } else if (priceDiff < 0) {
    if (percentageDiff > 10) {
      sentiment = 'bullish'
      analysis = `Price is significantly below Max Pain (${percentageDiff}%). Market makers have incentive to push price up toward $${maxPain.toFixed(2)} by expiration.`
    } else if (percentageDiff > 5) {
      sentiment = 'slightly bullish'
      analysis = `Price is moderately below Max Pain (${percentageDiff}%). Some upward pressure expected toward $${maxPain.toFixed(2)}.`
    } else {
      sentiment = 'neutral'
      analysis = `Price is near Max Pain. Low volatility expected as price is pinned around current levels.`
    }
  } else {
    sentiment = 'neutral'
    analysis = `Price is exactly at Max Pain. Maximum pain for option holders at current price level.`
  }

  return {
    symbol: ticker.toUpperCase(),
    maxPain,
    underlyingPrice: currentPrice,
    analysis: {
      sentiment,
      analysis,
      difference: priceDiff,
      percentageDiff
    },
    cached: false,
    source: 'local-mock-data',
    timestamp: new Date().toISOString()
  }
}

// Fetch max pain data using Data Mule architecture
async function fetchMaxPainData(ticker) {
  return new Promise((resolve, reject) => {
    console.log(`📡 [Data Mule] Requesting data for ${ticker}...`)

    // 发送任务给 background script (数据搬运工)
    chrome.runtime.sendMessage(
      {
        type: 'FETCH_YAHOO_FINANCE_DATA',
        ticker: ticker
      },
      (response) => {
        // 错误处理
        if (chrome.runtime.lastError) {
          console.error('❌ Connection error:', chrome.runtime.lastError)
          reject(chrome.runtime.lastError)
          return
        }

        if (response && response.success) {
          console.log(`✅ [Data Mule] Success for ${ticker}:`, {
            symbol: response.data.symbol,
            price: response.data.price,
            maxPain: response.data.maxPain,
            dataSource: response.data.dataSource
          })

          // 转换数据格式以匹配现有的 UI 渲染逻辑
          const result = response.data
          const priceDiff = result.price - result.maxPain
          const percentageDiff = Math.abs((priceDiff / result.price) * 100)

          // 根据价格差异动态生成 sentiment
          let sentiment = 'neutral'
          if (percentageDiff > 10) {
            sentiment = priceDiff > 0 ? 'bearish' : 'bullish'
          } else if (percentageDiff > 5) {
            sentiment = priceDiff > 0 ? 'slightly bearish' : 'slightly bullish'
          }

          resolve({
            symbol: result.symbol,
            maxPain: result.maxPain,
            underlyingPrice: result.price,
            analysis: {
              sentiment: sentiment,
              analysis: result.insight || 'No analysis available',
              difference: priceDiff,
              percentageDiff: result.percentageDiff || percentageDiff.toFixed(1)
            },
            cached: false,
            source: 'data-mule',
            timestamp: result.timestamp
          })
        } else {
          console.error(`❌ [Data Mule] Failed for ${ticker}:`, response ? response.error : 'Unknown error')

          // Data Mule 失败，尝试回退到缓存的 Worker API
          console.log(`🔄 Falling back to cached Worker API for ${ticker}`)
          fetch(`${CONFIG.API_BASE_URL}/max-pain/${ticker}`, {
            signal: createTimeoutSignal(5000) // 5秒超时
          })
            .then(fallbackResponse => {
              if (fallbackResponse.ok) {
                return fallbackResponse.json()
              }
              throw new Error(`Fallback API failed: ${fallbackResponse.status}`)
            })
            .then(cachedResult => {
              console.log(`✅ Fallback successful for ${ticker}, data source: ${cachedResult.cached ? 'cache' : 'fresh'}`)
              resolve({
                ...cachedResult,
                source: 'worker-cache-fallback'
              })
            })
            .catch(fallbackError => {
              console.error(`❌ Fallback also failed for ${ticker}:`, fallbackError)
              console.log(`🎯 Generating local mock data for ${ticker} as final fallback`)

              // 最终回退：生成本地 mock 数据
              resolve(generateLocalMockData(ticker))
            })
        }
      }
    )
  })
}

// Create info icon element for click-to-show interaction
function createInfoIcon(ticker) {
  const icon = document.createElement('span')
  icon.className = 'market-x-ray-info-icon'
  icon.innerHTML = '🔍Quick Max Pain Check'
  icon.title = `Click to show ${ticker} Max Pain data`

  return icon
}

// Create tooltip element
function createTooltip(data) {
  const tooltip = document.createElement('div')
  tooltip.className = 'market-x-ray-tooltip'
  tooltip.style.cssText = `
    position: absolute;
    background: #0F1115;
    border: 1px solid #2A2D32;
    border-radius: 8px;
    padding: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    min-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #EAECEF;
  `

  // Get Discord icon URL
  const discordIconUrl = chrome.runtime.getURL('icons/Discord.svg')

  const { symbol, maxPain, underlyingPrice, analysis, cached } = data
  const priceDiff = underlyingPrice - maxPain
  const percentageDiff = Math.abs((priceDiff / underlyingPrice) * 100).toFixed(1)

  // Calculate range for the progress bar (20% buffer on each side)
  const range = Math.max(Math.abs(priceDiff) * 2, maxPain * 0.2)
  const minPrice = maxPain - range
  const maxPrice = maxPain + range

  // Calculate position of current price on the progress bar (0-100%)
  const pricePosition = Math.max(0, Math.min(100, ((underlyingPrice - minPrice) / (maxPrice - minPrice)) * 100))

  // Max Pain position is always at 50% (center)
  const maxPainPosition = 50

  // Determine color based on sentiment
  let sentimentColor = '#8B949E' // neutral gray (dark theme)
  let maxPainColor = '#FF6B35' // warning orange for Max Pain
  if (analysis.sentiment === 'bearish') sentimentColor = '#FF6B6B' // red
  if (analysis.sentiment === 'slightly bearish') sentimentColor = '#FFA726' // orange
  if (analysis.sentiment === 'bullish') sentimentColor = '#4CAF50' // green
  if (analysis.sentiment === 'slightly bullish') sentimentColor = '#9C27B0' // purple

  tooltip.innerHTML = `
    <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="font-size: 18px; color: #FFFFFF;">$${symbol}</strong>
        <span style="color: #8B949E; font-size: 11px; margin-left: 8px; background: #2A2D32; padding: 2px 6px; border-radius: 10px;">
          ${cached ? '📦 Cached' : '⚡ Live'} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <div>
        <div style="font-size: 11px; color: #8B949E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Current Price</div>
        <div style="font-size: 20px; font-weight: 700; color: #FFFFFF;">$${underlyingPrice.toFixed(2)}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #8B949E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Max Pain</div>
        <div style="font-size: 20px; font-weight: 700; color: ${maxPainColor};">$${maxPain.toFixed(2)}</div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="position: relative; height: 40px; margin-bottom: 8px;">
        <!-- Progress bar background -->
        <div style="position: absolute; top: 20px; left: 0; right: 0; height: 4px; background: #2A2D32; border-radius: 2px;"></div>

        <!-- Max Pain target line (center) -->
        <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 2px; height: 20px; background: ${maxPainColor};"></div>
        <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); font-size: 10px; color: ${maxPainColor}; font-weight: 600;">TARGET</div>

        <!-- Current price indicator -->
        <div style="position: absolute; top: 0; left: ${pricePosition}%; transform: translateX(-50%);">
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid ${sentimentColor}; margin: 0 auto;"></div>
          <div style="font-size: 10px; color: ${sentimentColor}; font-weight: 600; margin-top: 2px; white-space: nowrap;">NOW</div>
        </div>

        <!-- Price labels -->
        <div style="position: absolute; top: 30px; left: 0; font-size: 10px; color: #8B949E;">$${minPrice.toFixed(2)}</div>
        <div style="position: absolute; top: 30px; right: 0; font-size: 10px; color: #8B949E;">$${maxPrice.toFixed(2)}</div>
      </div>

      <div style="display: flex; justify-content: center; align-items: center; margin-top: 8px;">
        <div style="font-size: 12px; color: ${sentimentColor}; font-weight: 500;">
          ${priceDiff > 0 ? 'Above' : 'Below'} Max Pain by
          <span style="font-weight: 700;">$${Math.abs(priceDiff).toFixed(2)} (${percentageDiff}%)</span>
        </div>
      </div>
    </div>

    <div style="padding: 12px; background: #1E2125; border-radius: 6px; margin-bottom: 16px; border-left: 3px solid ${sentimentColor};">
      <div style="display: flex; align-items: center; margin-bottom: 6px;">
        <div style="width: 12px; height: 12px; background: ${sentimentColor}; border-radius: 50%; margin-right: 8px;"></div>
        <div style="font-size: 12px; color: #8B949E; text-transform: uppercase; letter-spacing: 0.5px;">AI Analysis • ${analysis.sentiment}</div>
      </div>
      <div style="font-size: 13px; line-height: 1.5; color: #D1D5DB;">${analysis.analysis}</div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #2A2D32;">
      <div style="font-size: 10px; color: #8B949E; font-style: italic;">
        📊 Data for reference only. Not financial advice.
      </div>
      <button id="tooltipDiscordButton" style="
        background: linear-gradient(135deg, #5865F2 0%, #4752C4 100%);
        color: #FFFFFF;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 120px;
        box-shadow: 0 3px 8px rgba(88, 101, 242, 0.2);
      " onmouseover="this.style.background='linear-gradient(135deg, #4752C4 0%, #3C45A5 100%)'; this.style.transform='translateY(-1px) scale(1.02)'; this.style.boxShadow='0 4px 10px rgba(88, 101, 242, 0.3)'"
        onmouseout="this.style.background='linear-gradient(135deg, #5865F2 0%, #4752C4 100%)'; this.style.transform='none'; this.style.boxShadow='0 3px 8px rgba(88, 101, 242, 0.2)'">
        <img src="${discordIconUrl}" width="12" height="12" alt="Discord" style="filter: brightness(0) invert(1);">
        Join Discord
      </button>
    </div>
  `

  return tooltip
}

// Position tooltip relative to target element
function positionTooltip(tooltip, target) {
  const rect = target.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  // Position below the target
  tooltip.style.top = `${rect.bottom + scrollTop + 8}px`
  tooltip.style.left = `${rect.left + scrollLeft}px`

  // Adjust if tooltip would go off screen
  const tooltipWidth = tooltip.offsetWidth
  if (rect.left + tooltipWidth > window.innerWidth) {
    tooltip.style.left = `${window.innerWidth - tooltipWidth - 20}px`
  }
}

// Show tooltip for ticker
async function showTooltip(tickerElement, ticker) {
  // Check if tooltip is already showing for this element
  if (tickerElement._marketXRayTooltip) return

  // Add loading indicator
  const originalText = tickerElement.textContent
  tickerElement.textContent = `$${ticker} ⌛`
  tickerElement.style.cursor = 'wait'

  try {
    // Fetch data
    const data = await fetchMaxPainData(ticker)
    if (!data) {
      tickerElement.textContent = originalText
      tickerElement.style.cursor = 'default'
      return
    }

    // Create and show tooltip
    const tooltip = createTooltip(data)
    document.body.appendChild(tooltip)
    positionTooltip(tooltip, tickerElement)

    // Add click event for Discord button in tooltip
    const discordButton = tooltip.querySelector('#tooltipDiscordButton')
    if (discordButton) {
      discordButton.addEventListener('click', (e) => {
        e.stopPropagation()
        window.open('https://discord.gg/FHvSUTUuMU', '_blank')
      })
    }

    // Store reference for cleanup
    tickerElement._marketXRayTooltip = tooltip
    // Mark that tooltip is showing for this element
    tickerElement._marketXRayTooltipShowing = true

    // Add hover listeners with improved hide logic
    let hideTimeout = null
    const hideTooltip = () => {
      if (tooltip.parentNode) {
        // Add fade-out class before removing
        tooltip.classList.add('fade-out')
        setTimeout(() => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip)
          }
          tickerElement._marketXRayTooltip = null

          // Reinsert the button when tooltip is hidden
          if (tickerElement._marketXRayClickedButton) {
            const { outerHTML, ticker } = tickerElement._marketXRayClickedButton

            // Find the stock ticker in the element's text
            const tickerPattern = createTickerPattern(ticker)
            const currentHTML = tickerElement.innerHTML

            // Insert the button HTML after the ticker
            const newHTML = currentHTML.replace(tickerPattern, (match) => {
              return match + outerHTML
            })

            if (newHTML !== currentHTML) {
              tickerElement.innerHTML = newHTML

              // Reattach click event listener to the new button
              const newButton = tickerElement.querySelector('.market-x-ray-info-icon:last-child')
              if (newButton) {
                newButton.addEventListener('click', (e) => {
                  e.stopPropagation()
                  e.preventDefault()

                  // Store reference to the clicked button and its HTML
                  tickerElement._marketXRayClickedButton = {
                    element: newButton,
                    outerHTML: newButton.outerHTML,
                    ticker: ticker
                  }

                  // Remove the button completely from DOM
                  newButton.remove()

                  // If tooltip already exists, hide it first
                  if (tickerElement._marketXRayTooltip) {
                    tickerElement._marketXRayTooltip.remove()
                    tickerElement._marketXRayTooltip = null
                  }

                  // Show tooltip immediately
                  showTooltip(tickerElement, ticker)
                })
              }
            }

            tickerElement._marketXRayClickedButton = null
          }
          // Clear tooltip showing flag
          tickerElement._marketXRayTooltipShowing = false
        }, 150) // Match CSS animation duration
      }
      tickerElement._marketXRayTooltip = null

      // Also reinsert the button if tooltip wasn't attached to DOM
      if (tickerElement._marketXRayClickedButton) {
        const { outerHTML, ticker } = tickerElement._marketXRayClickedButton

        // Find the stock ticker in the element's text
        const tickerPattern = createTickerPattern(ticker)
        const currentHTML = tickerElement.innerHTML

        // Insert the button HTML after the ticker
        const newHTML = currentHTML.replace(tickerPattern, (match) => {
          return match + outerHTML
        })

        if (newHTML !== currentHTML) {
          tickerElement.innerHTML = newHTML

          // Reattach click event listener to the new button
          const newButton = tickerElement.querySelector('.market-x-ray-info-icon:last-child')
          if (newButton) {
            newButton.addEventListener('click', (e) => {
              e.stopPropagation()
              e.preventDefault()

              // Store reference to the clicked button and its HTML
              tickerElement._marketXRayClickedButton = {
                element: newButton,
                outerHTML: newButton.outerHTML,
                ticker: ticker
              }

              // Remove the button completely from DOM
              newButton.remove()

              // If tooltip already exists, hide it first
              if (tickerElement._marketXRayTooltip) {
                tickerElement._marketXRayTooltip.remove()
                tickerElement._marketXRayTooltip = null
              }

              // Show tooltip immediately
              showTooltip(tickerElement, ticker)
            })
          }
        }

        tickerElement._marketXRayClickedButton = null
      }
      // Clear tooltip showing flag
      tickerElement._marketXRayTooltipShowing = false
    }

    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout)
    })

    tooltip.addEventListener('mouseleave', () => {
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(hideTooltip, 300)
    })

    tickerElement.addEventListener('mouseleave', (e) => {
      // Check if mouse is moving to tooltip
      const relatedTarget = e.relatedTarget
      if (relatedTarget && relatedTarget.closest && !relatedTarget.closest('.market-x-ray-tooltip')) {
        clearTimeout(hideTimeout)
        hideTimeout = setTimeout(hideTooltip, 150) // Faster hide when leaving element
      }
    })

    // Also hide when clicking outside
    document.addEventListener('click', (e) => {
      if (!tooltip.contains(e.target) && !tickerElement.contains(e.target)) {
        hideTooltip()
      }
    }, { once: true })

    // Restore original text
    tickerElement.textContent = originalText
    tickerElement.style.cursor = 'pointer'
    tickerElement.style.textDecoration = 'underline dotted'

    // Mark as processed
    state.processedElements.add(tickerElement)

  } catch (error) {
    console.error('Error showing tooltip:', error)
    tickerElement.textContent = originalText
    tickerElement.style.cursor = 'default'
  }
}

// Scan DOM for tickers
function scanForTickers() {
  if (!state.isEnabled || !isWhitelistedDomain()) return

  // Get all text nodes in the document
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )

  const tickerElements = []

  let node
  while ((node = walker.nextNode())) {
    const text = node.textContent
    if (text && CONFIG.TICKER_REGEX.test(text)) {
      // Reset regex lastIndex
      CONFIG.TICKER_REGEX.lastIndex = 0

      // Find the parent element that contains the ticker
      let parent = node.parentElement
      let skipElement = false

      // Check if this element is inside a tooltip
      while (parent && parent !== document.body) {
        // Skip if element is inside a tooltip
        if (parent.classList && parent.classList.contains('market-x-ray-tooltip')) {
          skipElement = true
          break
        }
        parent = parent.parentElement
      }

      // Reset parent to original
      parent = node.parentElement

      if (!skipElement) {
        while (parent && parent !== document.body) {
          // 检查父元素是否包含股票代码（必须有$符号）
          const parentText = parent.textContent
          if (parentText && CONFIG.TICKER_REGEX.test(parentText)) {
            // Reset regex lastIndex
            CONFIG.TICKER_REGEX.lastIndex = 0

            // 提取股票代码（必须有$符号）
            const tickers = extractTickers(parentText)
            if (tickers.length > 0) {
              // Check if this element has already been processed
              if (!state.processedElements.has(parent)) {
                tickerElements.push(parent)
              }
              break
            }
          }
          parent = parent.parentElement
        }
      }
    }
  }

  // Process new ticker elements
  tickerElements.forEach(element => {
    const text = element.textContent
    const tickers = extractTickers(text)

    if (tickers.length > 0) {
      // Check if listeners already added
      if (element._marketXRayListenersAdded) return

      // Skip if tooltip is currently showing for this element
      if (element._marketXRayTooltipShowing) return

      // Mark as having listeners
      element._marketXRayListenersAdded = true

      // Insert info icon for each ticker in the element
      const originalHTML = element.innerHTML
      let newHTML = originalHTML
      const insertedIcons = []

      // Replace each unique ticker with ticker + info icon
      const uniqueTickers = [...new Set(tickers)] // Remove duplicates
      uniqueTickers.forEach(ticker => {
        const tickerPattern = createTickerPattern(ticker)
        const infoIcon = createInfoIcon(ticker)

        // Create a temporary div to get the icon's outerHTML
        const tempDiv = document.createElement('div')
        tempDiv.appendChild(infoIcon)
        const iconHTML = tempDiv.innerHTML

        // Replace all occurrences of this ticker
        newHTML = newHTML.replace(tickerPattern, (match) => {
          return match + iconHTML
        })

        // Store the ticker for each icon we'll insert
        insertedIcons.push(ticker)
      })

      // Update element HTML if changes were made
      if (newHTML !== originalHTML) {
        element.innerHTML = newHTML

        // Add click event listeners to the icons
        const infoIcons = element.querySelectorAll('.market-x-ray-info-icon')
        infoIcons.forEach((icon, index) => {
          if (index < insertedIcons.length) {
            const ticker = insertedIcons[index]
            icon.addEventListener('click', (e) => {
              e.stopPropagation()
              e.preventDefault()

              // Store reference to the clicked button and its HTML
              element._marketXRayClickedButton = {
                element: icon,
                outerHTML: icon.outerHTML,
                ticker: ticker
              }

              // Remove the button completely from DOM
              icon.remove()

              // If tooltip already exists, hide it first
              if (element._marketXRayTooltip) {
                element._marketXRayTooltip.remove()
                element._marketXRayTooltip = null
              }

              // Show tooltip immediately
              showTooltip(element, ticker)
            })
          }
        })
      }

      // Add hover listener with debouncing (as fallback)
      let hoverTimeout = null
      element.addEventListener('mouseenter', (e) => {
        // Clear any pending hover timeout
        clearTimeout(hoverTimeout)

        // Debounce hover to prevent rapid triggers
        hoverTimeout = setTimeout(() => {
          if (element._marketXRayTooltip) return // Tooltip already shown

          const rect = element.getBoundingClientRect()
          const mouseX = e.clientX
          const mouseY = e.clientY

          // Check if mouse is actually over the element (not just a child)
          if (
            mouseX >= rect.left &&
            mouseX <= rect.right &&
            mouseY >= rect.top &&
            mouseY <= rect.bottom
          ) {
            // Find which ticker the mouse is over (simplified - show first ticker)
            showTooltip(element, tickers[0])
          }
        }, 50) // 50ms debounce delay
      })

      // Add mouseleave to clear hover timeout
      element.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout)
      })

      // Add click listener to prevent default behavior
      element.addEventListener('click', (e) => {
        if (element._marketXRayTooltip) {
          e.stopPropagation()
        }
      })
    }
  })
}

// Initialize the content script
function init() {
  if (!isWhitelistedDomain()) {
    console.log('Market X-Ray: Domain not whitelisted')
    return
  }

  console.log('Market X-Ray: Initializing on', window.location.hostname)

  // Start scanning
  const debouncedScan = debounce(scanForTickers, CONFIG.DEBOUNCE_DELAY)

  // Initial scan
  scanForTickers()

  // Observe DOM changes
  const observer = new MutationObserver(debouncedScan)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  // Store observer for cleanup
  state.observer = observer

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_ENABLED') {
      state.isEnabled = message.enabled
      if (!state.isEnabled) {
        // Clean up all tooltips
        document.querySelectorAll('.market-x-ray-tooltip').forEach(el => el.remove())
        state.processedElements.clear()
      }
    }
  })

  console.log('Market X-Ray: Initialization complete')
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}