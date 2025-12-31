/**
 * Stock Price Service
 * Fetches latest stock prices from multiple free APIs
 * Supports dynamic symbol resolution for Indian stocks
 */

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  currency: string
  timestamp: Date
}

/**
 * Resolve Yahoo Finance symbol for Indian stocks
 * Converts plain symbols to Yahoo Finance format
 */
function resolveYahooSymbol(symbol: string, exchange?: string): string {
  // Remove any existing suffix
  const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '').toUpperCase()

  // Add appropriate suffix based on exchange or default to NSE
  if (exchange === 'BSE') {
    return `${cleanSymbol}.BO`
  }
  // Default to NSE for Indian stocks
  return `${cleanSymbol}.NS`
}

/**
 * Option 1: Yahoo Finance API (Free, No API Key Required)
 * Uses the chart endpoint which is publicly accessible
 */
async function fetchFromYahooFinance(symbol: string, exchange?: string): Promise<StockQuote | null> {
  try {
    const yahooSymbol = resolveYahooSymbol(symbol, exchange)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d&includePrePost=false`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error(`Yahoo Finance HTTP error for ${symbol}: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Check if we have valid data
    const result = data.chart?.result?.[0]
    if (!result) {
      console.error(`Yahoo Finance: No data for ${symbol}`)
      return null
    }

    const meta = result.meta
    const quotes = result.indicators?.quote?.[0]

    if (!meta) {
      console.error(`Yahoo Finance: No meta data for ${symbol}`)
      return null
    }

    // Get current/regular market price
    const currentPrice = meta.regularMarketPrice || quotes?.close?.[quotes.close.length - 1]

    if (!currentPrice) {
      console.error(`Yahoo Finance: No price data for ${symbol}`)
      return null
    }

    // Get previous close for change calculation
    const previousClose = meta.previousClose || quotes?.open?.[0] || currentPrice

    return {
      symbol,
      price: currentPrice,
      change: currentPrice - previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose) * 100,
      currency: meta.currency || 'INR',
      timestamp: new Date()
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Yahoo Finance error for ${symbol}:`, errorMsg)
    return null
  }
}

/**
 * Option 2: NSE India API (Official NSE endpoint)
 * Works well for NSE listed stocks
 */
async function fetchFromNSE(symbol: string): Promise<StockQuote | null> {
  try {
    // NSE API uses the symbol directly
    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.nseindia.com/'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const priceInfo = data?.priceInfo
    const metadata = data?.info

    if (!priceInfo || !priceInfo.lastPrice) {
      return null
    }

    return {
      symbol,
      price: priceInfo.lastPrice,
      change: priceInfo.priceChange || 0,
      changePercent: priceInfo.priceChangePercentage || 0,
      currency: 'INR',
      timestamp: new Date()
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`NSE API error for ${symbol}:`, errorMsg)
    return null
  }
}

/**
 * Option 3: Groww API Alternative (Unofficial but reliable for Indian stocks)
 */
async function fetchFromGroww(symbol: string): Promise<StockQuote | null> {
  try {
    const url = `https://groww.in/v1/api/stocks_data/v1/exchange/NSE/${symbol}/latest`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    const priceInfo = data?.data?.latestPrice

    if (!priceInfo) return null

    return {
      symbol,
      price: priceInfo,
      change: 0, // Groww API doesn't provide change directly
      changePercent: 0,
      currency: 'INR',
      timestamp: new Date()
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Groww API error for ${symbol}:`, errorMsg)
    return null
  }
}

/**
 * Main function to fetch stock price
 * Tries multiple sources with fallback
 */
export async function fetchStockPrice(symbol: string, exchange?: string): Promise<StockQuote | null> {
  // For Indian stocks, try Yahoo Finance first (most reliable)
  const yahooResult = await fetchFromYahooFinance(symbol, exchange)
  if (yahooResult) {
    console.log(`✓ Fetched ${symbol} from Yahoo Finance: ₹${yahooResult.price}`)
    return yahooResult
  }

  // Try NSE API for NSE stocks
  if (exchange === 'NSE' || !exchange) {
    const nseResult = await fetchFromNSE(symbol)
    if (nseResult) {
      console.log(`✓ Fetched ${symbol} from NSE: ₹${nseResult.price}`)
      return nseResult
    }
  }

  // Try Groww as final fallback
  const growwResult = await fetchFromGroww(symbol)
  if (growwResult) {
    console.log(`✓ Fetched ${symbol} from Groww: ₹${growwResult.price}`)
    return growwResult
  }

  console.error(`✗ Failed to fetch price for ${symbol} from all sources`)
  return null
}

/**
 * Batch fetch stock prices for multiple symbols
 * Processes in batches to avoid rate limiting
 */
export async function fetchMultipleStockPrices(
  symbols: string[],
  exchange?: string
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>()

  console.log(`Fetching prices for ${symbols.length} symbols...`)

  // Fetch in parallel with a delay to avoid rate limiting
  const batchSize = 3 // Reduced for better reliability
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const promises = batch.map(async (symbol) => {
      const quote = await fetchStockPrice(symbol, exchange)
      if (quote) {
        results.set(symbol, quote)
      }
      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    })
    await Promise.all(promises)

    // Longer delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`Successfully fetched ${results.size}/${symbols.length} prices`)
  return results
}

/**
 * Calculate IPO gain/loss percentage
 */
export function calculateIPOGain(latestPrice: number, offerPriceMax: number): number {
  if (!offerPriceMax || offerPriceMax === 0) return 0
  return ((latestPrice - offerPriceMax) / offerPriceMax) * 100
}

/**
 * Test function to verify API is working
 * Call this to test a specific symbol
 */
export async function testFetchPrice(symbol: string) {
  console.log(`Testing price fetch for ${symbol}...`)
  const result = await fetchStockPrice(symbol, 'NSE')
  if (result) {
    console.log(`✅ Success: ${symbol} = ₹${result.price}`)
  } else {
    console.log(`❌ Failed: ${symbol}`)
  }
  return result
}
