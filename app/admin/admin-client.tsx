'use client'

import { useState } from 'react'
import Link from 'next/link'

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
  const [formData, setFormData] = useState({
    srNo: '',
    name: '',
    symbol: '',
    dateRange: '',
    offerPrice: '',
    lotSize: '',
    type: 'mainboard',
    subscription: '',
    listingPrice: '',
    exchange: 'NSE',
    token: '',
    status: 'upcoming',
    description: ''
  })

  const fetchIPOs = async () => {
    try {
      const response = await fetch('/api/ipos')
      const data = await response.json()
      setIpos(data)
    } catch (error) {
      console.error('Error fetching IPOs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingId ? `/api/ipos/${editingId}` : '/api/ipos'
    const method = editingId ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchIPOs()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving IPO:', error)
    }
  }

  const handleEdit = (ipo: IPO) => {
    setFormData({
      srNo: ipo.srNo.toString(),
      name: ipo.name,
      symbol: ipo.symbol,
      dateRange: ipo.dateRangeStart && ipo.dateRangeEnd
        ? `${new Date(ipo.dateRangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(ipo.dateRangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${new Date(ipo.dateRangeEnd).getFullYear()}`
        : '',
      offerPrice: ipo.offerPriceMin && ipo.offerPriceMax
        ? `${ipo.offerPriceMin}${ipo.offerPriceMax !== ipo.offerPriceMin ? `-${ipo.offerPriceMax}` : ''}`
        : '',
      lotSize: ipo.lotSize?.toString() || '',
      type: ipo.type || 'mainboard',
      subscription: ipo.subscription?.toString() || '',
      listingPrice: ipo.listingPrice?.toString() || '',
      exchange: ipo.exchange || 'NSE',
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
      await fetch(`/api/ipos/${id}`, { method: 'DELETE' })
      await fetchIPOs()
    } catch (error) {
      console.error('Error deleting IPO:', error)
    }
  }

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true)
    try {
      const response = await fetch('/api/stock-price/update', { method: 'POST' })
      const data = await response.json()
      alert(`Updated ${data.updated} IPO prices`)
      await fetchIPOs()
    } catch (error) {
      console.error('Error updating prices:', error)
      alert('Failed to update prices')
    } finally {
      setUpdatingPrices(false)
    }
  }

  const resetForm = () => {
    setFormData({
      srNo: '',
      name: '',
      symbol: '',
      dateRange: '',
      offerPrice: '',
      lotSize: '',
      type: 'mainboard',
      subscription: '',
      listingPrice: '',
      exchange: 'NSE',
      token: '',
      status: 'upcoming',
      description: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const currentStatus = formData.status as IPO['status']

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Manage IPO Data</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/ipos" className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                View Public Page
              </Link>
              <button
                onClick={handleUpdatePrices}
                disabled={updatingPrices}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {updatingPrices ? 'Updating...' : 'Update Prices'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            IPOs ({ipos.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add New IPO'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingId ? 'Edit IPO' : 'Add New IPO'}
            </h3>

            {/* Status Notice */}
            {currentStatus === 'listed' && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                <strong>Listed IPO:</strong> Latest price will be fetched from API automatically. Click "Update Prices" button to refresh.
              </div>
            )}

            {/* General Notice */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              <strong>Tip:</strong> Only fields marked with * are required. Fill in whatever information you have, leave the rest blank and update later.
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Always Required */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sr. No *</label>
                <input
                  type="number"
                  required
                  value={formData.srNo}
                  onChange={(e) => setFormData({ ...formData, srNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IPO Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {currentStatus !== 'listed' && (
                  <p className="text-xs text-slate-500 mt-1">Leave blank if not known yet</p>
                )}
              </div>

              {/* Always visible fields: Type and Exchange */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type (Optional)</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select exchange...</option>
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </div>

              {/* Optional Fields - Always visible */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Range (Optional)</label>
                <input
                  type="text"
                  placeholder="Dec 22 - Dec 24, 2025"
                  value={formData.dateRange}
                  onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Offer Price (Optional)</label>
                <input
                  type="text"
                  placeholder="108-114"
                  value={formData.offerPrice}
                  onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lot Size (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 600"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subscription (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 5.21"
                  value={formData.subscription}
                  onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Listing Price (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 120"
                  value={formData.listingPrice}
                  onChange={(e) => setFormData({ ...formData, listingPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* API Token - Always visible but optional */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Token (Optional)</label>
                <input
                  type="text"
                  placeholder="Trading token"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update' : 'Create'} IPO
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sr</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Latest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Change %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {ipos.map((ipo) => (
                <tr key={ipo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{ipo.srNo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{ipo.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{ipo.symbol || <span className="text-slate-400 italic">TBD</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {ipo.offerPriceMin && ipo.offerPriceMax
                      ? `₹${ipo.offerPriceMin} - ₹${ipo.offerPriceMax}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {ipo.latestPrice ? `₹${ipo.latestPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {ipo.priceChangePercent !== null && ipo.priceChangePercent !== undefined ? (
                      <span className={ipo.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {ipo.priceChangePercent >= 0 ? '+' : ''}{ipo.priceChangePercent.toFixed(2)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ipo.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      ipo.status === 'open' ? 'bg-green-100 text-green-800' :
                      ipo.status === 'closed' ? 'bg-slate-100 text-slate-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(ipo)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ipo.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
