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

    // Filter IPOs with symbols
    const iposWithSymbols = ipos.filter(ipo => ipo.symbol && ipo.symbol.trim() !== '')

    // Process IPOs in parallel batches (much faster than sequential)
    const BATCH_SIZE = 10 // Process 10 IPOs at a time
    const BATCH_DELAY = 100 // Reduced delay to 100ms between batches

    for (let i = 0; i < iposWithSymbols.length; i += BATCH_SIZE) {
      const batch = iposWithSymbols.slice(i, i + BATCH_SIZE)

      // Process batch in parallel
      const batchPromises = batch.map(async (ipo) => {
        try {
          const quote = await fetchStockPrice(ipo.symbol!, ipo.exchange || 'NSE')

          if (!quote) {
            return {
              symbol: ipo.symbol,
              status: 'not_found',
              error: 'No data from API'
            }
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

          return {
            symbol: ipo.symbol,
            name: ipo.name,
            oldPrice,
            newPrice: quote.price,
            changePercent: priceChangePercent
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Error updating ${ipo.symbol}:`, errorMsg)
          return {
            symbol: ipo.symbol,
            status: 'error',
            error: errorMsg
          }
        }
      })

      // Wait for all items in this batch to complete
      const batchResults = await Promise.all(batchPromises)

      // Count successful updates and collect results
      for (const result of batchResults) {
        if (!result.status && result.symbol) {
          updatedCount++
        }
        results.push(result)
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < iposWithSymbols.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    // Add skipped IPOs (without symbols) to results
    for (const ipo of ipos) {
      if (!ipo.symbol || ipo.symbol.trim() === '') {
        results.push({
          name: ipo.name,
          status: 'skipped',
          error: 'No symbol'
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
