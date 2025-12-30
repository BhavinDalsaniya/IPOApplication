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
    const d = new Date(date)
    const day = d.getDate()
    const month = d.toLocaleDateString('en-IN', { month: 'short' })
    const year = d.getFullYear().toString().slice(-2)
    return `${day} ${month}'${year}`
  }

  const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start && !end) return '-'
    const startDate = formatDate(start)
    const endDate = formatDate(end)
    if (start && end) {
      const startYear = new Date(start).getFullYear()
      const endYear = new Date(end).getFullYear()
      if (startYear === endYear) {
        return `${startDate} - ${endDate.slice(0, -3)}'${endYear.toString().slice(-2)}`
      }
    }
    return `${startDate} - ${endDate}`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400',
      open: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400',
      closed: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white border-slate-300',
      listed: 'bg-gradient-to-r from-violet-500 to-violet-600 text-white border-violet-400'
    }
    return colors[status as keyof typeof colors] || colors.upcoming
  }

  const getTypeColor = (type: string | null | undefined) => {
    if (!type) return 'bg-slate-100 text-slate-700 border-slate-300'
    return type === 'mainboard'
      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-300'
      : 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border-cyan-300'
  }

  const getListingGainPercent = (listingPrice: number | null | undefined, offerPriceMax: number | null | undefined) => {
    if (!listingPrice || !offerPriceMax) return null
    return ((listingPrice - offerPriceMax) / offerPriceMax) * 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">IPO Tracker</h1>
                <p className="text-xs text-slate-500">Track. Analyze. Decide.</p>
              </div>
            </Link>
            <Link href="/admin" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total IPOs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{ipos.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{ipos.filter(i => i.status === 'upcoming').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Open Now</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{ipos.filter(i => i.status === 'open').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Listed</p>
                <p className="text-3xl font-bold text-violet-600 mt-1">{ipos.filter(i => i.status === 'listed').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Status
              </label>
              <form>
                <select
                  name="status"
                  defaultValue={status}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium text-slate-700"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">🔵 Upcoming</option>
                  <option value="open">🟢 Open</option>
                  <option value="closed">⚪ Closed</option>
                  <option value="listed">🟣 Listed</option>
                </select>
                <input type="submit" value="Filter" className="hidden" />
              </form>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Type
              </label>
              <form>
                <select
                  name="type"
                  defaultValue={type}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium text-slate-700"
                >
                  <option value="all">All Types</option>
                  <option value="mainboard">📊 Mainboard</option>
                  <option value="sme">💼 SME</option>
                </select>
                <input type="submit" value="Filter" className="hidden" />
              </form>
            </div>
          </div>
        </div>

        {/* IPOs Table */}
        {ipos.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">No IPOs found. Add some in the admin dashboard.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <div>Sr</div>
                      <div className="text-[10px] text-slate-400 font-normal">No</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <div>IPO</div>
                      <div className="text-[10px] text-slate-400 font-normal">Name</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Offer</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Lot</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Sub</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">List</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <div>List</div>
                      <div className="text-[10px] text-slate-400 font-normal">Gain%</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <div>Latest</div>
                      <div className="text-[10px] text-slate-400 font-normal">Price</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <div>Up/</div>
                      <div className="text-[10px] text-slate-400 font-normal">Down%</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-200">
                  {ipos.map((ipo, index) => {
                    const listingGainPercent = getListingGainPercent(ipo.listingPrice, ipo.offerPriceMax)

                    return (
                      <tr key={ipo.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-violet-50/50 transition-all duration-200">
                        {/* Sr. No */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                            {ipo.srNo}
                          </span>
                        </td>

                        {/* IPO Name */}
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 max-w-[200px] truncate" title={ipo.name}>
                          {ipo.name}
                        </td>

                        {/* Symbol */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            {ipo.symbol}
                          </span>
                        </td>

                        {/* Date Range */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {ipo.status === 'upcoming' ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            formatDateRange(ipo.dateRangeStart, ipo.dateRangeEnd)
                          )}
                        </td>

                        {/* Offer Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {ipo.offerPriceMin && ipo.offerPriceMax ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                              ₹{ipo.offerPriceMin}{ipo.offerPriceMax !== ipo.offerPriceMin ? `-${ipo.offerPriceMax}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Lot Size */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-slate-700">
                          {ipo.lotSize ? (
                            <span className="font-semibold">{ipo.lotSize}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ipo.type ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(ipo.type)}`}>
                              {ipo.type === 'mainboard' ? '📊' : '💼'} {ipo.type.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Subscription */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          {ipo.subscription ? (
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                              {ipo.subscription}x
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Listing Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                          {ipo.listingPrice ? (
                            <span className="font-semibold">₹{ipo.listingPrice}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Listing Gain % */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {listingGainPercent !== null ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              listingGainPercent >= 0
                                ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-300'
                                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-300'
                            }`}>
                              {listingGainPercent >= 0 ? '↑' : '↓'} {Math.abs(listingGainPercent).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Latest Stock Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {ipo.latestPrice ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-bold border border-blue-300">
                              ₹{ipo.latestPrice.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Up/Down % from IPO Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {ipo.priceChangePercent !== null && ipo.priceChangePercent !== undefined ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              ipo.priceChangePercent >= 0
                                ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-300'
                                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-300'
                            }`}>
                              {ipo.priceChangePercent >= 0 ? '↑' : '↓'} {Math.abs(ipo.priceChangePercent).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${getStatusColor(ipo.status)}`}>
                            {ipo.status === 'upcoming' && '🔵 '}
                            {ipo.status === 'open' && '🟢 '}
                            {ipo.status === 'closed' && '⚪ '}
                            {ipo.status === 'listed' && '🟣 '}
                            {ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center pb-8">
          <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="text-xs text-slate-400 mt-1">Data refreshes automatically every hour</p>
        </footer>
      </main>
    </div>
  )
}
