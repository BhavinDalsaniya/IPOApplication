import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminClient from './admin-client'

export default async function AdminPage() {
  const ipos = await prisma.iPO.findMany({
    orderBy: { srNo: 'asc' }
  })

  return <AdminClient initialIpos={ipos} />
}
