'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface IPO {
  id: string
  srNo: number
  name: string
  symbol: string | null
  dateRangeStart?: string | null
  dateRangeEnd?: string | null
  offerPriceMin?: number | null
  offerPriceMax?: number | null
  lotSize?: number | null
  type?: 'mainboard' | 'sme' | null
  subscription?: number | null
  gmp?: number | null
  gmpPercent?: number | null
  listingPrice?: number | null
  latestPrice?: number | null
  priceChangePercent?: number | null
  priceUpdatedAt?: string | null
  exchange?: 'NSE' | 'BSE' | null
  token?: string | null
  status: 'upcoming' | 'open' | 'closed' | 'listed'
  description?: string | null
}

interface AdminClientProps {
  initialIpos: IPO[]
}

export default function AdminClient({ initialIpos }: AdminClientProps) {
  const [ipos, setIpos] = useState<IPO[]>(initialIpos)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [updatingPrices, setUpdatingPrices] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    dateRange: '',
    offerPrice: '',
    lotSize: '',
    type: '',
    subscription: '',
    gmp: '',
    gmpPercent: '',
    listingPrice: '',
    listingGainPercent: '',
    exchange: '',
    token: '',
    status: 'upcoming',
    description: ''
  })

  // Sort IPOs by date (newest first)
  const sortedIpos = useMemo(() => {
    return [...ipos].sort((a, b) => {
      // Use dateRangeEnd primarily, fallback to dateRangeStart, then srNo
      const dateA = a.dateRangeEnd || a.dateRangeStart
      const dateB = b.dateRangeEnd || b.dateRangeStart

      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      }
      if (dateA) return -1
      if (dateB) return 1
      return b.srNo - a.srNo
    })
  }, [ipos])

  // Filter by status and search
  const filteredIpos = useMemo(() => {
    let filtered = sortedIpos

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ipo => ipo.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ipo =>
        ipo.name.toLowerCase().includes(query) ||
        ipo.symbol?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [sortedIpos, statusFilter, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: ipos.length,
      upcoming: ipos.filter(i => i.status === 'upcoming').length,
      open: ipos.filter(i => i.status === 'open').length,
      closed: ipos.filter(i => i.status === 'closed').length,
      listed: ipos.filter(i => i.status === 'listed').length,
      mainboard: ipos.filter(i => i.type === 'mainboard').length,
      sme: ipos.filter(i => i.type === 'sme').length,
    }
  }, [ipos])

  const getOfferPriceMax = () => {
    if (!formData.offerPrice) return null
    const parts = formData.offerPrice.split('-')
    return parseFloat(parts[1]?.trim() || parts[0]?.trim() || '0') || null
  }

  const handleListingPriceChange = (value: string) => {
    setFormData({ ...formData, listingPrice: value })
    const listingPrice = parseFloat(value)
    const offerPriceMax = getOfferPriceMax()

    if (listingPrice && offerPriceMax) {
      const gainPercent = ((listingPrice - offerPriceMax) / offerPriceMax) * 100
      setFormData(prev => ({ ...prev, listingPrice: value, listingGainPercent: gainPercent.toFixed(2) }))
    } else if (!value) {
      setFormData(prev => ({ ...prev, listingPrice: value, listingGainPercent: '' }))
    }
  }

  const handleListingGainPercentChange = (value: string) => {
    setFormData({ ...formData, listingGainPercent: value })
    const gainPercent = parseFloat(value)
    const offerPriceMax = getOfferPriceMax()

    if (gainPercent !== null && gainPercent !== undefined && offerPriceMax) {
      const listingPrice = offerPriceMax * (1 + gainPercent / 100)
      setFormData(prev => ({ ...prev, listingGainPercent: value, listingPrice: listingPrice.toFixed(2) }))
    } else if (!value) {
      setFormData(prev => ({ ...prev, listingGainPercent: value, listingPrice: '' }))
    }
  }

  const nextSrNo = useMemo(() => {
    if (ipos.length === 0) return 1
    return Math.max(...ipos.map(i => i.srNo)) + 1
  }, [ipos])

  const fetchIPOs = async () => {
    try {
      const response = await fetch('/api/ipos?_t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()
      setIpos(data.ipos || data)
    } catch (error) {
      console.error('Error fetching IPOs:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchIPOs()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingId ? `/api/ipos/${editingId}` : '/api/ipos'
    const method = editingId ? 'PUT' : 'POST'
    const payload = editingId ? formData : { ...formData, srNo: nextSrNo.toString() }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchIPOs()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save IPO')
      }
    } catch (error) {
      console.error('Error saving IPO:', error)
      alert('Failed to save IPO')
    }
  }

  const handleEdit = (ipo: IPO) => {
    let listingGainPercent = ''
    if (ipo.listingPrice && ipo.offerPriceMax) {
      listingGainPercent = (((ipo.listingPrice - ipo.offerPriceMax) / ipo.offerPriceMax) * 100).toFixed(2)
    }

    setFormData({
      name: ipo.name,
      symbol: ipo.symbol || '',
      dateRange: ipo.dateRangeStart && ipo.dateRangeEnd
        ? `${new Date(ipo.dateRangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(ipo.dateRangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${new Date(ipo.dateRangeEnd).getFullYear()}`
        : '',
      offerPrice: ipo.offerPriceMin && ipo.offerPriceMax
        ? `${ipo.offerPriceMin}${ipo.offerPriceMax !== ipo.offerPriceMin ? `-${ipo.offerPriceMax}` : ''}`
        : '',
      lotSize: ipo.lotSize?.toString() || '',
      type: ipo.type || '',
      subscription: ipo.subscription?.toString() || '',
      gmp: ipo.gmp?.toString() || '',
      gmpPercent: ipo.gmpPercent?.toString() || '',
      listingPrice: ipo.listingPrice?.toString() || '',
      listingGainPercent,
      exchange: ipo.exchange || '',
      token: ipo.token || '',
      status: ipo.status,
      description: ipo.description || ''
    })
    setEditingId(ipo.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this IPO?')) return

    try {
      const response = await fetch(`/api/ipos/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchIPOs()
      } else {
        alert('Failed to delete IPO')
      }
    } catch (error) {
      console.error('Error deleting IPO:', error)
      alert('Failed to delete IPO')
    }
  }

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/ipos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchIPOs()
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true)
    try {
      const response = await fetch('/api/stock-price/update', { method: 'POST' })
      const data = await response.json()
      alert(`✅ Updated ${data.updated} IPO prices successfully`)
      await fetchIPOs()
    } catch (error) {
      console.error('Error updating prices:', error)
      alert('❌ Failed to update prices')
    } finally {
      setUpdatingPrices(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      dateRange: '',
      offerPrice: '',
      lotSize: '',
      type: '',
      subscription: '',
      gmp: '',
      gmpPercent: '',
      listingPrice: '',
      listingGainPercent: '',
      exchange: '',
      token: '',
      status: 'upcoming',
      description: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  const currentStatus = formData.status as IPO['status']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent leading-tight">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Manage IPO Data</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/ipos" className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm">
                View Public Page
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center gap-2"
                title="Refresh IPO list from server"
              >
                {refreshing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={handleUpdatePrices}
                disabled={updatingPrices}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 shadow-lg shadow-green-500/30 flex items-center gap-2"
              >
                {updatingPrices ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Prices
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-500 mt-1">Total IPOs</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-lg border border-cyan-200/50 p-4">
            <div className="text-2xl font-bold text-cyan-700">{stats.upcoming}</div>
            <div className="text-xs text-cyan-600 mt-1">Upcoming</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg border border-emerald-200/50 p-4">
            <div className="text-2xl font-bold text-emerald-700">{stats.open}</div>
            <div className="text-xs text-emerald-600 mt-1">Open</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow-lg border border-slate-200/50 p-4">
            <div className="text-2xl font-bold text-slate-700">{stats.closed}</div>
            <div className="text-xs text-slate-600 mt-1">Closed</div>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl shadow-lg border border-violet-200/50 p-4">
            <div className="text-2xl font-bold text-violet-700">{stats.listed}</div>
            <div className="text-xs text-violet-600 mt-1">Listed</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200/50 p-4">
            <div className="text-2xl font-bold text-amber-700">{stats.mainboard}</div>
            <div className="text-xs text-amber-600 mt-1">Mainboard</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              IPOs {statusFilter !== 'all' && `(${statusFilter})`}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Showing {filteredIpos.length} of {stats.total} total
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30"
          >
            {showForm ? '✕ Cancel' : '+ Add New IPO'}
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 mr-2">Filter:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                statusFilter === 'upcoming'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Upcoming ({stats.upcoming})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                statusFilter === 'open'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Open ({stats.open})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                statusFilter === 'closed'
                  ? 'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Closed ({stats.closed})
            </button>
            <button
              onClick={() => setStatusFilter('listed')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                statusFilter === 'listed'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Listed ({stats.listed})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IPO name or symbol..."
              className="w-full pl-12 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingId ? '✏️ Edit IPO' : '➕ Add New IPO'}
            </h3>

            {currentStatus === 'listed' && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                <strong>📈 Listed IPO:</strong> Latest price will be fetched from API automatically. Click "Update Prices" button to refresh.
              </div>
            )}

            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              <strong>💡 Tip:</strong> Only fields marked with * are required. Fill in whatever information you have.
              {!editingId && <span className="block mt-1">🔢 Sr. No will be auto-generated: <strong>{nextSrNo}</strong></span>}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IPO Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Symbol {currentStatus === 'listed' ? '*' : '(Optional)'}
                </label>
                <input
                  type="text"
                  required={currentStatus === 'listed'}
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  placeholder={currentStatus === 'listed' ? 'e.g., RELIANCE' : 'Add when listed'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {currentStatus !== 'listed' && (
                  <p className="text-xs text-slate-500 mt-1">Leave blank if not known yet</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type (Optional)</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select type...</option>
                  <option value="mainboard">Mainboard</option>
                  <option value="sme">SME</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exchange (Optional)</label>
                <select
                  value={formData.exchange}
                  onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select exchange...</option>
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Range (Optional)</label>
                <input
                  type="text"
                  placeholder="Dec 22 - Dec 24, 2025"
                  value={formData.dateRange}
                  onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Offer Price (Optional)</label>
                <input
                  type="text"
                  placeholder="108-114"
                  value={formData.offerPrice}
                  onChange={(e) => {
                    const newOfferPrice = e.target.value
                    setFormData({ ...formData, offerPrice: newOfferPrice })

                    const parts = newOfferPrice.split('-')
                    const offerPriceMax = parseFloat(parts[1]?.trim() || parts[0]?.trim() || '0')

                    // Recalculate Listing Gain % if Listing Price exists
                    if (formData.listingPrice) {
                      const listingPrice = parseFloat(formData.listingPrice)
                      if (listingPrice && offerPriceMax) {
                        const gainPercent = ((listingPrice - offerPriceMax) / offerPriceMax) * 100
                        setFormData(prev => ({ ...prev, offerPrice: newOfferPrice, listingGainPercent: gainPercent.toFixed(2) }))
                      }
                    }

                    // Recalculate GMP % if GMP exists
                    if (formData.gmp) {
                      const gmp = parseFloat(formData.gmp)
                      if (gmp && offerPriceMax) {
                        const gmpPercent = (gmp / offerPriceMax) * 100
                        setFormData(prev => ({ ...prev, offerPrice: newOfferPrice, gmpPercent: gmpPercent.toFixed(2) }))
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lot Size (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 600"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subscription (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 5.21"
                  value={formData.subscription}
                  onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GMP (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 120"
                  value={formData.gmp}
                  onChange={(e) => {
                    const gmpValue = e.target.value
                    setFormData({ ...formData, gmp: gmpValue })
                    const gmp = parseFloat(gmpValue)
                    const offerPriceMax = getOfferPriceMax()

                    // Auto-calculate GMP % when GMP changes
                    if (gmp && offerPriceMax) {
                      const gmpPercent = (gmp / offerPriceMax) * 100
                      setFormData(prev => ({ ...prev, gmp: gmpValue, gmpPercent: gmpPercent.toFixed(2) }))
                    } else if (!gmpValue) {
                      setFormData(prev => ({ ...prev, gmp: gmpValue, gmpPercent: '' }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GMP % (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 5.26"
                  value={formData.gmpPercent}
                  onChange={(e) => {
                    const gmpPercentValue = e.target.value
                    setFormData({ ...formData, gmpPercent: gmpPercentValue })
                    const gmpPercent = parseFloat(gmpPercentValue)
                    const offerPriceMax = getOfferPriceMax()

                    // Auto-calculate GMP when GMP % changes
                    if (gmpPercent !== null && gmpPercent !== undefined && offerPriceMax) {
                      const gmp = (offerPriceMax * gmpPercent) / 100
                      setFormData(prev => ({ ...prev, gmpPercent: gmpPercentValue, gmp: gmp.toFixed(2) }))
                    } else if (!gmpPercentValue) {
                      setFormData(prev => ({ ...prev, gmpPercent: gmpPercentValue, gmp: '' }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Listing Price (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 120"
                  value={formData.listingPrice}
                  onChange={(e) => handleListingPriceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Listing Gain % (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Auto-calculated or enter manually"
                  value={formData.listingGainPercent}
                  onChange={(e) => handleListingGainPercentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Token (Optional)</label>
                <input
                  type="text"
                  placeholder="Trading token"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="listed">Listed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                >
                  {editingId ? '💾 Update' : '✨ Create'} IPO
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Latest</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200">
                {filteredIpos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg">No IPOs found</p>
                        <p className="text-sm text-slate-400">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIpos.map((ipo) => (
                    <tr key={ipo.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-violet-50/50 transition-all duration-200">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">{ipo.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ipo.symbol ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            {ipo.symbol}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">TBD</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="text-xs">{formatDate(ipo.dateRangeStart)}</div>
                        <div className="text-xs">{formatDate(ipo.dateRangeEnd)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {ipo.offerPriceMin && ipo.offerPriceMax
                          ? `₹${ipo.offerPriceMin}-${ipo.offerPriceMax}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {ipo.latestPrice ? `₹${ipo.latestPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {ipo.priceChangePercent !== null && ipo.priceChangePercent !== undefined ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                            ipo.priceChangePercent >= 0
                              ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-300'
                              : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-300'
                          }`}>
                            {ipo.priceChangePercent >= 0 ? '↑' : '↓'} {Math.abs(ipo.priceChangePercent).toFixed(2)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ipo.type ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            ipo.type === 'mainboard'
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-300'
                              : 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border-cyan-300'
                          }`}>
                            {ipo.type === 'mainboard' ? '📊 MAIN' : '💼 SME'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={ipo.status}
                          onChange={(e) => handleQuickStatusChange(ipo.id, e.target.value)}
                          className={`px-3 py-1 text-xs font-bold rounded-full border-0 cursor-pointer ${
                            ipo.status === 'upcoming' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md' :
                            ipo.status === 'open' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md' :
                            ipo.status === 'closed' ? 'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-md' :
                            'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                          }`}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                          <option value="listed">Listed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(ipo)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(ipo.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
