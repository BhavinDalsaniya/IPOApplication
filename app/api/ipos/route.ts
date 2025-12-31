import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all IPOs - with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const ipos = await prisma.iPO.findMany({
      where,
      orderBy: { srNo: 'asc' }
    })

    return NextResponse.json(ipos)
  } catch (error) {
    console.error('Error fetching IPOs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IPOs' },
      { status: 500 }
    )
  }
}

// Helper function to parse date range
const parseDateRange = (dateRange: string) => {
  if (!dateRange) return { start: null, end: null }

  const parts = dateRange.split(' - ')
  const startPart = parts[0]?.trim()
  const endPart = parts[1]?.trim() || startPart

  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  }

  // Extract year from end part
  let year = new Date().getFullYear()
  const endTokens = endPart?.split(' ') || []
  if (endTokens.length > 2) {
    year = parseInt(endTokens[2]) || year
  }

  const parseDate = (part: string) => {
    if (!part) return null
    const tokens = part.trim().split(' ')
    const month = tokens[0]
    const day = parseInt(tokens[1]?.replace(',', '') || '1')
    return new Date(year, months[month] || 0, day)
  }

  return {
    start: parseDate(startPart),
    end: parseDate(endPart)
  }
}

// Helper function to parse offer price
const parseOfferPrice = (price: string) => {
  if (!price) return { min: null, max: null }
  const parts = price.split('-')
  const min = parseFloat(parts[0]?.trim())
  const max = parts[1] ? parseFloat(parts[1].trim()) : min
  return { min, max }
}

// POST create new IPO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const dateRange = parseDateRange(body.dateRange)
    const offerPrice = parseOfferPrice(body.offerPrice)

    const ipo = await prisma.iPO.create({
      data: {
        srNo: parseInt(body.srNo) || 0,
        name: body.name,
        symbol: body.symbol,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        offerPriceMin: offerPrice.min,
        offerPriceMax: offerPrice.max,
        lotSize: body.lotSize ? parseInt(body.lotSize) : null,
        type: body.type || null,
        subscription: body.subscription ? parseFloat(body.subscription) : null,
        listingPrice: body.listingPrice ? parseFloat(body.listingPrice) : null,
        exchange: body.exchange || null,
        token: body.token || null,
        status: body.status || 'upcoming',
        description: body.description || null
      }
    })

    return NextResponse.json(ipo, { status: 201 })
  } catch (error) {
    console.error('Error creating IPO:', error)
    return NextResponse.json(
      { error: 'Failed to create IPO', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
