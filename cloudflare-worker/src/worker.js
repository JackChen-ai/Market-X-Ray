// worker.js - 纯计算节点 (The Brain)
// 不再发起对 Yahoo 的请求，只接收数据进行计算

import { Router } from 'itty-router'

// Create a new router
const router = Router()

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Helper function to handle CORS
function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }
}

// Cache key generator
function getCacheKey(symbol) {
  return `max-pain:${symbol.toUpperCase()}`
}

// Analyze data based on price vs max pain
function analyzeData(price, maxPain) {
  const diff = ((price - maxPain) / price) * 100
  if (diff > 10) return "Price significantly above Max Pain. Strong downward pressure expected."
  if (diff > 5) return "Price moderately above Max Pain. Some downward pressure expected."
  if (diff < -10) return "Price significantly below Max Pain. Strong upward pressure expected."
  if (diff < -5) return "Price moderately below Max Pain. Some upward pressure expected."
  return "Price pinned at Max Pain. Low volatility expected."
}

// Calculate Max Pain from options data
function calculateMaxPainFromOptions(options) {
  try {
    const { calls, puts } = options

    if (!calls || !puts || calls.length === 0 || puts.length === 0) {
      throw new Error('Insufficient options data for calculation')
    }

    // Get all unique strike prices
    const allStrikes = [...calls.map(c => c.strike), ...puts.map(p => p.strike)]
    const uniqueStrikes = [...new Set(allStrikes)].sort((a, b) => a - b)

    let minPain = Infinity
    let maxPainStrike = 0

    // Calculate pain for each strike price
    for (let candidatePrice of uniqueStrikes) {
      let totalPain = 0

      // Pain from calls (when price > strike)
      calls.forEach(call => {
        if (candidatePrice > call.strike) {
          totalPain += (candidatePrice - call.strike) * (call.openInterest || 0)
        }
      })

      // Pain from puts (when price < strike)
      puts.forEach(put => {
        if (candidatePrice < put.strike) {
          totalPain += (put.strike - candidatePrice) * (put.openInterest || 0)
        }
      })

      if (totalPain < minPain) {
        minPain = totalPain
        maxPainStrike = candidatePrice
      }
    }

    return {
      maxPain: maxPainStrike,
      minPainValue: minPain,
      strikesAnalyzed: uniqueStrikes.length
    }
  } catch (error) {
    console.error('Error calculating max pain:', error)
    throw error
  }
}

// Main endpoint: POST /api/analyze - Process raw Yahoo Finance data from frontend
router.post('/api/analyze', async (request, env) => {
  try {
    // Parse request body
    const body = await request.json()
    const { symbol, rawData, timestamp } = body

    if (!symbol || !rawData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: symbol and rawData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing raw Yahoo Finance data for ${symbol} from frontend`)

    // Extract options chain from Yahoo Finance raw data
    let optionsChain
    if (rawData.optionChain && rawData.optionChain.result && rawData.optionChain.result.length > 0) {
      optionsChain = rawData
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid Yahoo Finance data structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = optionsChain.optionChain.result[0]
    const quote = result.quote
    const currentPrice = quote.regularMarketPrice
    const options = result.options[0] // Nearest expiration

    // Calculate Max Pain
    const maxPainResult = calculateMaxPainFromOptions(options)

    // Generate analysis
    const insight = analyzeData(currentPrice, maxPainResult.maxPain)
    const percentageDiff = ((currentPrice - maxPainResult.maxPain) / currentPrice * 100).toFixed(1)

    // Prepare response
    const responseData = {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      maxPain: maxPainResult.maxPain,
      dataSource: 'client_mule', // 标记：数据来自客户端搬运
      insight: insight,
      percentageDiff: percentageDiff,
      strikesAnalyzed: maxPainResult.strikesAnalyzed,
      timestamp: timestamp || new Date().toISOString()
    }

    // Cache the result
    const cacheKey = getCacheKey(symbol)
    const cacheTtl = 3600 // 1 hour

    await env.CACHE.put(
      cacheKey,
      JSON.stringify({
        ...responseData,
        cached: true
      }),
      { expirationTtl: cacheTtl }
    )

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing analyze request:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process analyze request',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Legacy endpoint for backward compatibility
router.get('/api/max-pain/:symbol', async (request, env) => {
  const { symbol } = request.params

  if (!symbol || symbol.length > 5) {
    return new Response(
      JSON.stringify({ error: 'Invalid symbol format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Check cache first
    const cacheKey = getCacheKey(symbol)
    const cached = await env.CACHE.get(cacheKey, { type: 'json' })

    if (cached) {
      console.log(`Cache hit for ${symbol}`)
      return new Response(
        JSON.stringify({
          ...cached,
          cached: true,
          cacheTimestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No cache, return error (Worker no longer fetches data)
    return new Response(
      JSON.stringify({
        error: 'No cached data available',
        message: 'Worker now operates in data mule mode. Please use frontend to fetch data.',
        symbol: symbol.toUpperCase(),
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`Error processing ${symbol}:`, error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error.message,
        symbol: symbol.toUpperCase(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Health check endpoint
router.get('/health', () => {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Market X-Ray Worker (Data Mule Mode)',
      mode: 'pure_calculator',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

// 404 handler
router.all('*', () => {
  return new Response(
    JSON.stringify({
      error: 'Not Found',
      message: 'Use POST /api/analyze to send Yahoo Finance data for processing',
      availableEndpoints: ['POST /api/analyze', 'GET /health']
    }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

// Export the router
export default {
  fetch: router.handle,
}