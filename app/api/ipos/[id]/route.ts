import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single IPO
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ipo = await prisma.iPO.findUnique({
      where: { id: params.id }
    })

    if (!ipo) {
      return NextResponse.json(
        { error: 'IPO not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(ipo)
  } catch (error) {
    console.error('Error fetching IPO:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IPO' },
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

// PUT update IPO
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const updateData: any = {}

    if (body.srNo !== undefined) updateData.srNo = parseInt(body.srNo) || 0
    if (body.name !== undefined) updateData.name = body.name
    if (body.symbol !== undefined) updateData.symbol = body.symbol
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.exchange !== undefined) updateData.exchange = body.exchange || null
    if (body.token !== undefined) updateData.token = body.token || null
    if (body.status !== undefined) updateData.status = body.status

    // Handle optional numeric fields
    if (body.lotSize !== undefined) updateData.lotSize = body.lotSize ? parseInt(body.lotSize) : null
    if (body.type !== undefined) updateData.type = body.type || null
    if (body.subscription !== undefined) {
      updateData.subscription = body.subscription ? parseFloat(body.subscription) : null
    }
    if (body.gmp !== undefined) {
      updateData.gmp = body.gmp ? parseFloat(body.gmp) : null
    }
    if (body.gmpPercent !== undefined) {
      updateData.gmpPercent = body.gmpPercent ? parseFloat(body.gmpPercent) : null
    }
    if (body.listingPrice !== undefined) {
      updateData.listingPrice = body.listingPrice ? parseFloat(body.listingPrice) : null
    }

    if (body.dateRange) {
      const dateRange = parseDateRange(body.dateRange)
      updateData.dateRangeStart = dateRange.start
      updateData.dateRangeEnd = dateRange.end
    }

    if (body.offerPrice) {
      const offerPrice = parseOfferPrice(body.offerPrice)
      updateData.offerPriceMin = offerPrice.min
      updateData.offerPriceMax = offerPrice.max
    }

    const ipo = await prisma.iPO.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(ipo)
  } catch (error) {
    console.error('Error updating IPO:', error)
    return NextResponse.json(
      { error: 'Failed to update IPO', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE IPO
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.iPO.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'IPO deleted successfully' })
  } catch (error) {
    console.error('Error deleting IPO:', error)
    return NextResponse.json(
      { error: 'Failed to delete IPO' },
      { status: 500 }
    )
  }
}
