import { NextRequest, NextResponse } from 'next/server'
import { testFetchPrice, fetchStockPrice } from '@/lib/stockPrice'

/**
 * Test API endpoint to verify stock price fetching
 * Usage: /api/test-price?symbol=GKSL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol') || 'GKSL'
  const exchange = searchParams.get('exchange') || 'NSE'

  try {
    console.log(`Testing price fetch for ${symbol} from ${exchange}...`)

    const result = await fetchStockPrice(symbol, exchange)

    if (result) {
      return NextResponse.json({
        success: true,
        symbol: result.symbol,
        price: result.price,
        change: result.change,
        changePercent: result.changePercent,
        currency: result.currency,
        timestamp: result.timestamp,
        message: `Successfully fetched price for ${symbol}`
      })
    } else {
      return NextResponse.json({
        success: false,
        symbol,
        error: 'Failed to fetch price from all sources (Yahoo Finance, NSE, Groww)',
        tip: 'Make sure the stock symbol is correct and listed on NSE'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Server error while fetching price'
    }, { status: 500 })
  }
}
