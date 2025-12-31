'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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

interface IPOsClientProps {
  initialIpos: IPO[]
}

const STATUS_ORDER = ['upcoming', 'open', 'closed', 'listed']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function IPOsClient({ initialIpos }: IPOsClientProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  // Filter and sort IPOs
  const filteredIpos = useMemo(() => {
    let filtered = [...initialIpos]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ipo => ipo.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ipo => ipo.type === typeFilter)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ipo =>
        ipo.name.toLowerCase().includes(query) ||
        ipo.symbol?.toLowerCase().includes(query)
      )
    }

    // Filter by year
    if (yearFilter !== 'all') {
      filtered = filtered.filter(ipo => {
        const startYear = ipo.dateRangeStart ? new Date(ipo.dateRangeStart).getFullYear() : null
        const endYear = ipo.dateRangeEnd ? new Date(ipo.dateRangeEnd).getFullYear() : null
        const year = parseInt(yearFilter)
        return startYear === year || endYear === year
      })
    }

    // Filter by month (only if year is selected)
    if (yearFilter !== 'all' && monthFilter !== 'all') {
      filtered = filtered.filter(ipo => {
        const startMonth = ipo.dateRangeStart ? new Date(ipo.dateRangeStart).getMonth() : null
        const endMonth = ipo.dateRangeEnd ? new Date(ipo.dateRangeEnd).getMonth() : null
        const month = MONTHS.indexOf(monthFilter)
        return startMonth === month || endMonth === month
      })
    }

    // Sort by status priority, then by date (newest first)
    return filtered.sort((a, b) => {
      const statusOrderA = STATUS_ORDER.indexOf(a.status)
      const statusOrderB = STATUS_ORDER.indexOf(b.status)

      if (statusOrderA !== statusOrderB) {
        return statusOrderA - statusOrderB
      }

      // Within same status, sort by date (newest first)
      // Use dateRangeEnd as the primary date, fallback to dateRangeStart
      const dateA = a.dateRangeEnd || a.dateRangeStart
      const dateB = b.dateRangeEnd || b.dateRangeStart

      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      }

      // If no dates, fall back to srNo
      return a.srNo - b.srNo
    })
  }, [initialIpos, statusFilter, typeFilter, searchQuery, yearFilter, monthFilter])

  // Get available years from IPOs
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    initialIpos.forEach(ipo => {
      if (ipo.dateRangeStart) years.add(new Date(ipo.dateRangeStart).getFullYear())
      if (ipo.dateRangeEnd) years.add(new Date(ipo.dateRangeEnd).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [initialIpos])

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    const d = new Date(date)
    const day = d.getDate()
    const month = d.toLocaleDateString('en-IN', { month: 'short' })
    const year = d.getFullYear().toString().slice(-2)
    return `${day} ${month}'${year}`
  }

  const getListingGainPercent = (listingPrice: number | null, offerPriceMax: number | null) => {
    if (!listingPrice || !offerPriceMax) return null
    return ((listingPrice - offerPriceMax) / offerPriceMax) * 100
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

  const getTypeColor = (type: string | null) => {
    if (!type) return 'bg-slate-100 text-slate-700 border-slate-300'
    return type === 'mainboard'
      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-300'
      : 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border-cyan-300'
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
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Combined Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Year & Month Filters */}
            <div className="space-y-3">
              {/* Year Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 mr-2">Year:</span>
                <button
                  onClick={() => setYearFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    yearFilter === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => { setYearFilter(year.toString()); setMonthFilter('all') }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      yearFilter === year.toString()
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {/* Month Filter - Only show when year is selected */}
              {yearFilter !== 'all' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 mr-2">Month:</span>
                  <button
                    onClick={() => setMonthFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      monthFilter === 'all'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {MONTHS.map(month => (
                    <button
                      key={month}
                      onClick={() => setMonthFilter(month)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                        monthFilter === month
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Status, Type, and Search Filters */}
            <div className="space-y-3">
              {/* Status Filter - Button Style */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 mr-1">Status:</span>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'all'
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({initialIpos.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('upcoming')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'upcoming'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🔵 Upcoming ({initialIpos.filter(i => i.status === 'upcoming').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('open')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'open'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🟢 Open ({initialIpos.filter(i => i.status === 'open').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('closed')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'closed'
                        ? 'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ⚪ Closed ({initialIpos.filter(i => i.status === 'closed').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('listed')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'listed'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🟣 Listed ({initialIpos.filter(i => i.status === 'listed').length})
                  </button>
                </div>
              </div>

              {/* Type Filter - Button Style */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 mr-1">Type:</span>
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      typeFilter === 'all'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({initialIpos.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('mainboard')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      typeFilter === 'mainboard'
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📊 Main ({initialIpos.filter(i => i.type === 'mainboard').length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('sme')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      typeFilter === 'sme'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    💼 SME ({initialIpos.filter(i => i.type === 'sme').length})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search IPO name or symbol..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results count & Clear Filters */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery || yearFilter !== 'all' || monthFilter !== 'all') && (
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredIpos.length}</span> of <span className="font-semibold text-slate-900">{initialIpos.length}</span> IPOs
              </div>
              <button
                onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchQuery(''); setYearFilter('all'); setMonthFilter('all') }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* IPOs Table */}
        {filteredIpos.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">No IPOs found matching your filters.</p>
            <button
              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchQuery(''); setYearFilter('all'); setMonthFilter('all') }}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <div>#</div>
                      <div className="text-[10px] text-slate-400 font-normal">Sr</div>
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
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">GMP</th>
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
                  {filteredIpos.map((ipo, index) => {
                    const listingGainPercent = getListingGainPercent(ipo.listingPrice, ipo.offerPriceMax)
                    const dynamicSrNo = index + 1

                    return (
                      <tr key={ipo.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-violet-50/50 transition-all duration-200">
                        {/* Dynamic Sr. No */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                            {dynamicSrNo}
                          </span>
                        </td>

                        {/* IPO Name */}
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 max-w-[180px]">
                          <div className="leading-tight" title={ipo.name}>
                            {ipo.name}
                          </div>
                        </td>

                        {/* Symbol */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ipo.symbol ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                              {ipo.symbol}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
                          )}
                        </td>

                        {/* Date Range */}
                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                          {ipo.dateRangeStart || ipo.dateRangeEnd ? (
                            <div className="leading-tight">
                              <div>{formatDate(ipo.dateRangeStart)}</div>
                              <div>{formatDate(ipo.dateRangeEnd)}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
                          )}
                        </td>

                        {/* Offer Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {ipo.offerPriceMin && ipo.offerPriceMax ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                              ₹{ipo.offerPriceMin}{ipo.offerPriceMax !== ipo.offerPriceMin ? `-${ipo.offerPriceMax}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
                          )}
                        </td>

                        {/* Lot Size */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-slate-700">
                          {ipo.lotSize ? (
                            <span className="font-semibold">{ipo.lotSize}</span>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ipo.type ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(ipo.type)}`}>
                              {ipo.type === 'mainboard' ? '📊' : '💼'} {ipo.type === 'mainboard' ? 'MAIN' : 'SME'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Subscription */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          {ipo.subscription ? (
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                              {ipo.subscription}x
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
                          )}
                        </td>

                        {/* GMP */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {ipo.status === 'listed' ? (
                            <span className="text-slate-400 text-xs">N/A</span>
                          ) : ipo.gmp !== null && ipo.gmp !== undefined ? (
                            <span className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold ${
                              (ipo.gmpPercent || 0) >= 0
                                ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-300'
                                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-300'
                            }`}>
                              <span className="leading-tight">↑ ₹{ipo.gmp}</span>
                              {ipo.gmpPercent !== null && ipo.gmpPercent !== undefined && (
                                <span className="text-[10px] leading-tight">({ipo.gmpPercent.toFixed(2)}%)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Listing Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                          {ipo.listingPrice ? (
                            <span className="font-semibold">₹{ipo.listingPrice}</span>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
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
                            <span className="text-slate-400 text-xs">TBD</span>
                          )}
                        </td>

                        {/* Latest Stock Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {ipo.latestPrice ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-bold border border-blue-300">
                              ₹{ipo.latestPrice.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">TBD</span>
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
                            <span className="text-slate-400 text-xs">TBD</span>
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
          <p className="text-xs text-slate-400 mt-1">Sorted by: Upcoming → Open → Closed → Listed</p>
        </footer>
      </main>
    </div>
  )
}
