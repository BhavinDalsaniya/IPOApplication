import { prisma } from '@/lib/prisma'
import AdminClient from './admin-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const ipos = await prisma.iPO.findMany({
    orderBy: { srNo: 'asc' }
  })

  // Serialize Date objects to strings for client component
  const serializedIpos = ipos.map(ipo => ({
    ...ipo,
    type: ipo.type as 'mainboard' | 'sme' | null,
    exchange: ipo.exchange as 'NSE' | 'BSE' | null,
    status: ipo.status as 'upcoming' | 'open' | 'closed' | 'listed',
    dateRangeStart: ipo.dateRangeStart?.toISOString() || null,
    dateRangeEnd: ipo.dateRangeEnd?.toISOString() || null,
    priceUpdatedAt: ipo.priceUpdatedAt?.toISOString() || null,
    gmp: (ipo as any).gmp || null,
    gmpPercent: (ipo as any).gmpPercent || null,
    createdAt: ipo.createdAt.toISOString(),
    updatedAt: ipo.updatedAt.toISOString(),
  }))

  return <AdminClient initialIpos={serializedIpos} />
}
