import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchMultipleStockPrices, fetchStockPrice, calculateIPOGain } from '@/lib/stockPrice'

/**
 * API endpoint to update stock prices for all listed IPOs
 * Can be called manually or via cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Get all listed IPOs with symbols and exchange info
    const ipos = await prisma.iPO.findMany({
      where: {
        status: 'listed'
      }
    })

    if (ipos.length === 0) {
      return NextResponse.json({ message: 'No listed IPOs found', updated: 0 })
    }

    let updatedCount = 0
    const results: any[] = []

    // Fetch prices for each IPO individually (to use correct exchange)
    for (const ipo of ipos) {
      // Skip IPOs without a symbol
      if (!ipo.symbol || ipo.symbol.trim() === '') {
        results.push({
          name: ipo.name,
          status: 'skipped',
          error: 'No symbol'
        })
        continue
      }

      try {
        const quote = await fetchStockPrice(ipo.symbol, ipo.exchange || 'NSE')

        if (!quote) {
          results.push({
            symbol: ipo.symbol,
            status: 'not_found',
            error: 'No data from API'
          })
          continue
        }

        const oldPrice = ipo.latestPrice
        const priceChangePercent = ipo.offerPriceMax
          ? calculateIPOGain(quote.price, ipo.offerPriceMax)
          : null

        await prisma.iPO.update({
          where: { id: ipo.id },
          data: {
            latestPrice: quote.price,
            priceChangePercent,
            priceUpdatedAt: new Date()
          }
        })

        // Log the price update
        await prisma.priceUpdateLog.create({
          data: {
            ipoId: ipo.id,
            symbol: ipo.symbol,
            oldPrice,
            newPrice: quote.price,
            changePercent: priceChangePercent,
            source: 'API'
          }
        })

        updatedCount++
        results.push({
          symbol: ipo.symbol,
          name: ipo.name,
          oldPrice,
          newPrice: quote.price,
          changePercent: priceChangePercent
        })

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error updating ${ipo.symbol}:`, errorMsg)
        results.push({
          symbol: ipo.symbol,
          status: 'error',
          error: errorMsg
        })
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} IPO prices`,
      updated: updatedCount,
      total: ipos.length,
      results
    })
  } catch (error) {
    console.error('Error updating stock prices:', error)
    return NextResponse.json(
      { error: 'Failed to update stock prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check when prices were last updated
 */
export async function GET(request: NextRequest) {
  try {
    const ipos = await prisma.iPO.findMany({
      where: { status: 'listed' },
      select: {
        id: true,
        symbol: true,
        name: true,
        exchange: true,
        latestPrice: true,
        priceChangePercent: true,
        priceUpdatedAt: true
      },
      orderBy: { priceUpdatedAt: 'desc' }
    })

    return NextResponse.json({
      count: ipos.length,
      ipos
    })
  } catch (error) {
    console.error('Error fetching price status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price status' },
      { status: 500 }
    )
  }
}
