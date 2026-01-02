import { prisma } from '@/lib/prisma'
import IPOsClient from './ipos-client'

interface IPO {
  id: string
  srNo: number
  name: string
  symbol: string | null
  dateRangeStart: string | null
  dateRangeEnd: string | null
  offerPriceMin: number | null
  offerPriceMax: number | null
  lotSize: number | null
  type: 'mainboard' | 'sme' | null
  subscription: number | null
  gmp: number | null
  gmpPercent: number | null
  listingPrice: number | null
  latestPrice: number | null
  priceChangePercent: number | null
  priceUpdatedAt: string | null
  status: 'upcoming' | 'open' | 'closed' | 'listed'
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

async function getIPOs(page: number = 1, limit: number = 20): Promise<{
  ipos: IPO[]
  pagination: PaginationData
}> {
  const where: any = {}

  // Get total count
  const total = await prisma.iPO.count({ where })

  // Get paginated results
  const ipos = await prisma.iPO.findMany({
    where,
    orderBy: { srNo: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  })

  // Serialize Date objects to strings for client component
  const serializedIpos = ipos.map(ipo => ({
    ...ipo,
    type: ipo.type as 'mainboard' | 'sme' | null,
    status: ipo.status as 'upcoming' | 'open' | 'closed' | 'listed',
    dateRangeStart: ipo.dateRangeStart?.toISOString() || null,
    dateRangeEnd: ipo.dateRangeEnd?.toISOString() || null,
    priceUpdatedAt: ipo.priceUpdatedAt?.toISOString() || null,
    gmp: (ipo as any).gmp || null,
    gmpPercent: (ipo as any).gmpPercent || null,
  }))

  return {
    ipos: serializedIpos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IPOsPage() {
  const { ipos, pagination } = await getIPOs(1, 20)

  return <IPOsClient initialIpos={ipos} initialPagination={pagination} />
}
