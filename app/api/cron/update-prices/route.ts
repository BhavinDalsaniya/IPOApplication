import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron Job Endpoint for updating stock prices
 *
 * This endpoint can be called by external cron services like:
 * - Vercel Cron Jobs
 * - EasyCron
 * - cron-job.org
 *
 * Recommended: Run every 1 hour
 *
 * Example cron-job.org setup:
 * - URL: https://your-domain.com/api/cron/update-prices
 * - Execution: Every 1 hour
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const cronSecret = request.nextUrl.searchParams.get('secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the stock price update endpoint
    const updateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stock-price/update`
    const response = await fetch(updateUrl, { method: 'POST' })
    const data = await response.json()

    return NextResponse.json({
      cron: 'executed',
      timestamp: new Date().toISOString(),
      ...data
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', message: error.message },
      { status: 500 }
    )
  }
}

// Also support POST for cron services that use POST
export async function POST(request: NextRequest) {
  return GET(request)
}
