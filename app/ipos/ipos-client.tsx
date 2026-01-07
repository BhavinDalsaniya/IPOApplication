'use client'

import { useState, useEffect, useMemo } from 'react'
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

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface IPOsClientProps {
  initialIpos: IPO[]
  initialPagination: PaginationData
}

const STATUS_ORDER = ['upcoming', 'open', 'closed', 'listed']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function IPOsClient({ initialIpos, initialPagination }: IPOsClientProps) {
  const [ipos, setIpos] = useState<IPO[]>(initialIpos)
  const [pagination, setPagination] = useState<PaginationData>(initialPagination)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  // Fetch IPOs with filters, search, and pagination
  const fetchIPOs = async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const response = await fetch(`/api/ipos?${params.toString()}`)
      const data = await response.json()

      setIpos(data.ipos)
      setPagination(data.pagination)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching IPOs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters or search changes
  useEffect(() => {
    fetchIPOs(1)
  }, [statusFilter, typeFilter, searchQuery])

  // Filter and sort IPOs (client-side for year/month only)
  const filteredIpos = useMemo(() => {
    let filtered = [...ipos]

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

    return filtered
  }, [ipos, yearFilter, monthFilter])

  // Get available years from IPOs - use a separate fetch to get all years
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    ipos.forEach(ipo => {
      if (ipo.dateRangeStart) years.add(new Date(ipo.dateRangeStart).getFullYear())
      if (ipo.dateRangeEnd) years.add(new Date(ipo.dateRangeEnd).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [ipos])

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
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
      upcoming: 'relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 border border-blue-400/50 before:content-[""] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-cyan-400/20 before:via-blue-400/20 before:to-indigo-400/20 before:animate-pulse',
      open: 'relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-lg shadow-emerald-500/30 border border-emerald-400/50 before:content-[""] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-emerald-400/20 before:via-green-400/20 before:to-teal-400/20 before:animate-pulse',
      closed: 'relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-slate-400 via-gray-500 to-zinc-500 shadow-lg shadow-slate-500/30 border border-slate-400/50 before:content-[""] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-slate-400/20 before:via-gray-400/20 before:to-zinc-400/20 before:animate-pulse',
      listed: 'relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-violet-500/30 border border-violet-400/50 before:content-[""] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-violet-400/20 before:via-purple-400/20 before:to-fuchsia-400/20 before:animate-pulse'
    }
    return colors[status as keyof typeof colors] || colors.upcoming
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      upcoming: '<svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>',
      open: '<svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
      closed: '<svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
      listed: '<svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>'
    }
    return icons[status as keyof typeof icons] || icons.upcoming
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center space-x-2.5 group flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent leading-tight">IPO Tracker</h1>
              </div>
            </Link>

            {/* Search in Header */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search IPO name or symbol..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'all'
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('upcoming')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'upcoming'
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 text-cyan-700 hover:from-cyan-100 hover:via-blue-100 hover:to-indigo-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                    Upcoming
                  </button>
                  <button
                    onClick={() => setStatusFilter('open')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'open'
                        ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:via-green-100 hover:to-teal-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    Open
                  </button>
                  <button
                    onClick={() => setStatusFilter('closed')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'closed'
                        ? 'bg-gradient-to-r from-slate-400 via-gray-500 to-zinc-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 text-slate-700 hover:from-slate-100 hover:via-gray-100 hover:to-zinc-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                    Closed
                  </button>
                  <button
                    onClick={() => setStatusFilter('listed')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === 'listed'
                        ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 text-violet-700 hover:from-violet-100 hover:via-purple-100 hover:to-fuchsia-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    Listed
                  </button>
                </div>
              </div>

              {/* Type Filter - Button Style */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 mr-1">Type:</span>
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      typeFilter === 'all'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                    All
                  </button>
                  <button
                    onClick={() => setTypeFilter('mainboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      typeFilter === 'mainboard'
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-white shadow-md'
                        : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 text-amber-700 hover:from-amber-100 hover:via-orange-100 hover:to-amber-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                    Main
                  </button>
                  <button
                    onClick={() => setTypeFilter('sme')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      typeFilter === 'sme'
                        ? 'bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-600 text-white shadow-md'
                        : 'bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-100 text-cyan-700 hover:from-cyan-100 hover:via-teal-100 hover:to-cyan-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                    SME
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results count & Clear Filters */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery || yearFilter !== 'all' || monthFilter !== 'all') && (
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredIpos.length}</span> of <span className="font-semibold text-slate-900">{pagination.total}</span> IPOs
                {searchQuery && <span className="ml-1">for "{searchQuery}"</span>}
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
                      <div>Live</div>
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
                    const dynamicSrNo = (currentPage - 1) * pagination.limit + index + 1

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
                        <td className="px-4 py-3 text-sm text-slate-600 tabular-nums font-medium">
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
                          <span
                            className={`inline-flex items-center justify-center min-w-[6rem] overflow-hidden ${getStatusColor(ipo.status)}`}
                            title={ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
                          >
                            <span dangerouslySetInnerHTML={{ __html: getStatusIcon(ipo.status) }} />
                            {(() => {
                              const status = ipo.status
                              const displayStatus = status.charAt(0).toUpperCase() + status.slice(1)
                              return displayStatus.length <= 6
                                ? displayStatus
                                : displayStatus.slice(0, 4) + '..'
                            })()}
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

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 text-center sm:text-left">
                Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of <span className="font-bold text-slate-900">{pagination.totalPages}</span>
                <span className="ml-2">({pagination.total} total IPOs)</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => fetchIPOs(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:hover:bg-slate-100"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchIPOs(pageNum)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => fetchIPOs(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:hover:bg-slate-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
