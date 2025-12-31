import { prisma } from '@/lib/prisma'
import AdminClient from './admin-client'

export default async function AdminPage() {
  const ipos = await prisma.iPO.findMany({
    orderBy: { srNo: 'asc' }
  })

  // Serialize Date objects to strings for client component
  const serializedIpos = ipos.map(ipo => ({
    ...ipo,
    dateRangeStart: ipo.dateRangeStart?.toISOString() || null,
    dateRangeEnd: ipo.dateRangeEnd?.toISOString() || null,
    priceUpdatedAt: ipo.priceUpdatedAt?.toISOString() || null,
    createdAt: ipo.createdAt.toISOString(),
    updatedAt: ipo.updatedAt.toISOString(),
  }))

  return <AdminClient initialIpos={serializedIpos} />
}
