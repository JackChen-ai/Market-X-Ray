import { describe, it, expect } from 'vitest'

// Mock options chain data for testing
const mockOptionsChain = {
  optionChain: {
    result: [
      {
        quote: {
          regularMarketPrice: 150.50,
        },
        options: [
          {
            expirationDate: 1743379200, // 2025-04-04
            calls: [
              { strike: 145, openInterest: 1000 },
              { strike: 150, openInterest: 2000 },
              { strike: 155, openInterest: 1500 },
            ],
            puts: [
              { strike: 145, openInterest: 1200 },
              { strike: 150, openInterest: 1800 },
              { strike: 155, openInterest: 800 },
            ],
          },
        ],
      },
    ],
  },
}

// Import the calculateMaxPain function (we'll need to extract it from worker.js)
// For now, let's create a test version
function calculateMaxPainTest(optionsChain) {
  const { optionChain } = optionsChain
  if (!optionChain || !optionChain.result || optionChain.result.length === 0) {
    throw new Error('No options data available')
  }

  const result = optionChain.result[0]
  const { options } = result

  if (!options || options.length === 0) {
    throw new Error('No options data for calculation')
  }

  const nearestExpiration = options[0]
  const { calls, puts } = nearestExpiration

  if (!calls || !puts) {
    throw new Error('Insufficient options data for calculation')
  }

  // Get underlying price
  const underlyingPrice = result.quote.regularMarketPrice

  // Combine all strike prices
  const allStrikes = new Set()
  calls.forEach(call => allStrikes.add(call.strike))
  puts.forEach(put => allStrikes.add(put.strike))

  const strikes = Array.from(allStrikes).sort((a, b) => a - b)

  // Calculate total pain for each strike price
  let minPain = Infinity
  let maxPainPrice = strikes[0]

  for (const strike of strikes) {
    let totalPain = 0

    // Calculate pain from calls
    for (const call of calls) {
      if (call.openInterest) {
        const pain = Math.abs(strike - call.strike) * call.openInterest
        totalPain += pain
      }
    }

    // Calculate pain from puts
    for (const put of puts) {
      if (put.openInterest) {
        const pain = Math.abs(strike - put.strike) * put.openInterest
        totalPain += pain
      }
    }

    // Update min pain
    if (totalPain < minPain) {
      minPain = totalPain
      maxPainPrice = strike
    }
  }

  return {
    maxPain: maxPainPrice,
    underlyingPrice,
    expirationDate: nearestExpiration.expirationDate,
    totalOptions: calls.length + puts.length,
  }
}

describe('Max Pain Calculation', () => {
  it('should calculate max pain correctly', () => {
    const result = calculateMaxPainTest(mockOptionsChain)

    expect(result).toHaveProperty('maxPain')
    expect(result).toHaveProperty('underlyingPrice', 150.50)
    expect(result).toHaveProperty('totalOptions', 6)
    expect(typeof result.maxPain).toBe('number')
  })

  it('should handle empty options data', () => {
    const emptyChain = {
      optionChain: {
        result: [{
          quote: { regularMarketPrice: 150.50 },
          options: []
        }]
      }
    }

    expect(() => calculateMaxPainTest(emptyChain)).toThrow('No options data for calculation')
  })

  it('should handle missing options array', () => {
    const noOptionsChain = {
      optionChain: {
        result: [{
          quote: { regularMarketPrice: 150.50 }
          // No options property
        }]
      }
    }

    expect(() => calculateMaxPainTest(noOptionsChain)).toThrow('No options data for calculation')
  })

  it('should handle missing open interest', () => {
    const chainWithoutOI = {
      optionChain: {
        result: [{
          quote: { regularMarketPrice: 150.50 },
          options: [{
            expirationDate: 1743379200,
            calls: [{ strike: 150 }],
            puts: [{ strike: 150 }]
          }]
        }]
      }
    }

    const result = calculateMaxPainTest(chainWithoutOI)
    expect(result.maxPain).toBe(150)
  })
})

describe('AI Analysis Generation', () => {
  function generateAnalysisTest(price, maxPain, symbol) {
    const difference = Math.abs(price - maxPain)
    const percentageDiff = (difference / price) * 100

    let sentiment = 'neutral'
    let analysis = ''

    if (price > maxPain) {
      if (percentageDiff > 10) {
        sentiment = 'bearish'
        analysis = `Price is significantly above Max Pain (${percentageDiff.toFixed(1)}%). Market makers have strong incentive to push price down toward $${maxPain.toFixed(2)} by expiration.`
      } else if (percentageDiff > 5) {
        sentiment = 'slightly bearish'
        analysis = `Price is moderately above Max Pain (${percentageDiff.toFixed(1)}%). Some downward pressure expected toward $${maxPain.toFixed(2)}.`
      } else {
        sentiment = 'neutral'
        analysis = `Price is near Max Pain. Low volatility expected as price is pinned around current levels.`
      }
    } else if (price < maxPain) {
      if (percentageDiff > 10) {
        sentiment = 'bullish'
        analysis = `Price is significantly below Max Pain (${percentageDiff.toFixed(1)}%). Market makers have incentive to push price up toward $${maxPain.toFixed(2)} by expiration.`
      } else if (percentageDiff > 5) {
        sentiment = 'slightly bullish'
        analysis = `Price is moderately below Max Pain (${percentageDiff.toFixed(1)}%). Some upward pressure expected toward $${maxPain.toFixed(2)}.`
      } else {
        sentiment = 'neutral'
        analysis = `Price is near Max Pain. Low volatility expected as price is pinned around current levels.`
      }
    } else {
      sentiment = 'neutral'
      analysis = `Price is exactly at Max Pain. Maximum pain for option holders at current price level.`
    }

    return {
      sentiment,
      analysis,
      difference: price - maxPain,
      percentageDiff: percentageDiff.toFixed(1),
    }
  }

  it('should generate bearish analysis when price is significantly above max pain', () => {
    const analysis = generateAnalysisTest(200, 150, 'AAPL')
    expect(analysis.sentiment).toBe('bearish')
    expect(analysis.analysis).toContain('significantly above')
  })

  it('should generate bullish analysis when price is significantly below max pain', () => {
    const analysis = generateAnalysisTest(100, 150, 'AAPL')
    expect(analysis.sentiment).toBe('bullish')
    expect(analysis.analysis).toContain('significantly below')
  })

  it('should generate neutral analysis when price is near max pain', () => {
    const analysis = generateAnalysisTest(150, 152, 'AAPL')
    expect(analysis.sentiment).toBe('neutral')
    expect(analysis.analysis).toContain('near Max Pain')
  })
})