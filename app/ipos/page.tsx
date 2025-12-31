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
  listingPrice: number | null
  latestPrice: number | null
  priceChangePercent: number | null
  priceUpdatedAt: string | null
  status: 'upcoming' | 'open' | 'closed' | 'listed'
}

async function getIPOs(): Promise<IPO[]> {
  const ipos = await prisma.iPO.findMany({
    orderBy: { srNo: 'asc' }
  })

  // Serialize Date objects to strings for client component
  return ipos.map(ipo => ({
    ...ipo,
    dateRangeStart: ipo.dateRangeStart?.toISOString() || null,
    dateRangeEnd: ipo.dateRangeEnd?.toISOString() || null,
    priceUpdatedAt: ipo.priceUpdatedAt?.toISOString() || null,
  }))
}

export default async function IPOsPage() {
  const ipos = await getIPOs()

  return <IPOsClient initialIpos={ipos} />
}
