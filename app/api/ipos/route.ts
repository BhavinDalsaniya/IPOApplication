import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all IPOs - with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    // Get total count for pagination info
    const total = await prisma.iPO.count({ where })

    // Determine sort order based on status
    // For "listed" IPOs, sort by dateRangeEnd (newest first)
    // For "open" or "upcoming", sort by dateRangeStart (newest first)
    // For "closed", sort by dateRangeEnd (newest first)
    // For "all" (no filter), we need custom sorting by status priority
    let orderBy: any = { srNo: 'desc' }

    if (!status || status === 'all') {
      // For "all" status, sort by custom priority: upcoming=1, open=2, closed=3, listed=4
      // Then by date within each status group
      // Use raw query for complex sorting
      const ipos = await prisma.$queryRaw`
        SELECT *
        FROM "IPO"
        WHERE ${type ? Prisma.sql`type = ${type}` : Prisma.sql`1=1`}
        ORDER BY
          CASE status
            WHEN 'upcoming' THEN 1
            WHEN 'open' THEN 2
            WHEN 'closed' THEN 3
            WHEN 'listed' THEN 4
            ELSE 5
          END ASC,
          CASE
            WHEN status IN ('upcoming', 'open') THEN "dateRangeStart"
            ELSE "dateRangeEnd"
          END DESC NULLS LAST,
          "srNo" DESC
        LIMIT ${limit}
        OFFSET ${(page - 1) * limit}
      `

      return NextResponse.json({
        ipos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      })
    } else if (status === 'listed') {
      orderBy = { dateRangeEnd: 'desc' }
    } else if (status === 'open' || status === 'upcoming') {
      orderBy = { dateRangeStart: 'desc' }
    } else if (status === 'closed') {
      orderBy = { dateRangeEnd: 'desc' }
    }

    // Get paginated results
    const ipos = await prisma.iPO.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      ipos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
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

    // Check for duplicate name
    if (body.name) {
      const existingByName = await prisma.iPO.findUnique({
        where: { name: body.name }
      })
      if (existingByName) {
        return NextResponse.json(
          { error: 'IPO with this name already exists', field: 'name' },
          { status: 409 }
        )
      }
    }

    // Check for duplicate symbol (if provided)
    if (body.symbol && body.symbol.trim() !== '') {
      const existingBySymbol = await prisma.iPO.findUnique({
        where: { symbol: body.symbol }
      })
      if (existingBySymbol) {
        return NextResponse.json(
          { error: 'IPO with this symbol already exists', field: 'symbol' },
          { status: 409 }
        )
      }
    }

    const dateRange = parseDateRange(body.dateRange)
    const offerPrice = parseOfferPrice(body.offerPrice)

    const ipo = await prisma.iPO.create({
      data: {
        srNo: parseInt(body.srNo) || 0,
        name: body.name,
        symbol: body.symbol || null,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        offerPriceMin: offerPrice.min,
        offerPriceMax: offerPrice.max,
        lotSize: body.lotSize ? parseInt(body.lotSize) : null,
        type: body.type || null,
        subscription: body.subscription ? parseFloat(body.subscription) : null,
        gmp: body.gmp ? parseFloat(body.gmp) : null,
        gmpPercent: body.gmpPercent ? parseFloat(body.gmpPercent) : null,
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
