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
  return prisma.iPO.findMany({
    orderBy: { srNo: 'asc' }
  })
}

export default async function IPOsPage() {
  const ipos = await getIPOs()

  return <IPOsClient initialIpos={ipos} />
}
