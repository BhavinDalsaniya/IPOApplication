import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface IPO {
  id: string
  srNo: number
  name: string
  symbol: string
  dateRangeStart?: string | null
  dateRangeEnd?: string | null
  offerPriceMin?: number | null
  offerPriceMax?: number | null
  lotSize?: number | null
  type?: 'mainboard' | 'sme' | null
  subscription?: number | null
  listingPrice?: number | null
  latestPrice?: number | null
  priceChangePercent?: number | null
  priceUpdatedAt?: string | null
  status: 'upcoming' | 'open' | 'closed' | 'listed'
}

async function getIPOs(status?: string, type?: string): Promise<IPO[]> {
  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (type && type !== 'all') where.type = type

  return prisma.iPO.findMany({
    where,
    orderBy: { srNo: 'asc' }
  })
}

export default async function IPOsPage({
  searchParams
}: {
  searchParams: { status?: string; type?: string }
}) {
  const status = searchParams.status || 'all'
  const type = searchParams.type || 'all'
  const ipos = await getIPOs(status, type)

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start && !end) return '-'
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      open: 'bg-green-100 text-green-800',
      closed: 'bg-slate-100 text-slate-800',
      listed: 'bg-purple-100 text-purple-800'
    }
    return colors[status as keyof typeof colors] || colors.upcoming
  }

  const getTypeColor = (type: string | null | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-800'
    return type === 'mainboard' ? 'bg-orange-100 text-orange-800' : 'bg-cyan-100 text-cyan-800'
  }

  const getListingGainPercent = (listingPrice: number | null | undefined, offerPriceMax: number | null | undefined) => {
    if (!listingPrice || !offerPriceMax) return null
    return ((listingPrice - offerPriceMax) / offerPriceMax) * 100
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">IPO Tracker</h1>
              </div>
            </Link>
            <Link href="/admin" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <form>
                <select
                  name="status"
                  defaultValue={status}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="listed">Listed</option>
                </select>
                <input type="submit" value="Filter" className="hidden" />
              </form>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <form>
                <select
                  name="type"
                  defaultValue={type}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="mainboard">Mainboard</option>
                  <option value="sme">SME</option>
                </select>
                <input type="submit" value="Filter" className="hidden" />
              </form>
            </div>
          </div>
        </div>

        {/* IPOs Table */}
        {ipos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No IPOs found. Add some in the admin dashboard.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Sr. No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">IPO Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Date Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Offer Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Lot Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Subscription</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Listing Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Listing Gain %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Latest Stock Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Up/Down % from IPO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {ipos.map((ipo) => {
                  const listingGainPercent = getListingGainPercent(ipo.listingPrice, ipo.offerPriceMax)

                  return (
                    <tr key={ipo.id} className="hover:bg-slate-50">
                      {/* Sr. No */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{ipo.srNo}</td>

                      {/* IPO Name */}
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{ipo.name}</td>

                      {/* Symbol */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ipo.symbol}</td>

                      {/* Date Range */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {ipo.status === 'upcoming' ? '-' : formatDateRange(ipo.dateRangeStart, ipo.dateRangeEnd)}
                      </td>

                      {/* Offer Price */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {ipo.offerPriceMin && ipo.offerPriceMax ? `₹${ipo.offerPriceMin} - ₹${ipo.offerPriceMax}` : '-'}
                      </td>

                      {/* Lot Size */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {ipo.lotSize ? `${ipo.lotSize}` : '-'}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ipo.type ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(ipo.type)}`}>
                            {ipo.type.toUpperCase()}
                          </span>
                        ) : '-'}
                      </td>

                      {/* Subscription */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {ipo.subscription ? `${ipo.subscription}x` : '-'}
                      </td>

                      {/* Listing Price */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {ipo.listingPrice ? `₹${ipo.listingPrice}` : '-'}
                      </td>

                      {/* Listing Gain % */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {listingGainPercent !== null ? (
                          <span className={listingGainPercent >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {listingGainPercent >= 0 ? '+' : ''}{listingGainPercent.toFixed(2)}%
                          </span>
                        ) : '-'}
                      </td>

                      {/* Latest Stock Price */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {ipo.latestPrice ? `₹${ipo.latestPrice.toFixed(2)}` : '-'}
                      </td>

                      {/* Up/Down % from IPO Price */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {ipo.priceChangePercent !== null && ipo.priceChangePercent !== undefined ? (
                          <span className={ipo.priceChangePercent >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {ipo.priceChangePercent >= 0 ? '+' : ''}{ipo.priceChangePercent.toFixed(2)}%
                          </span>
                        ) : '-'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ipo.status)}`}>
                          {ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
