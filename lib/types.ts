// IPO Types
export interface IPO {
  id: string
  srNo: number
  name: string
  symbol: string
  dateRangeStart?: Date | null
  dateRangeEnd?: Date | null
  offerPriceMin?: number | null
  offerPriceMax?: number | null
  lotSize?: number | null
  type?: 'mainboard' | 'sme' | null
  subscription?: number | null
  listingPrice?: number | null
  // New columns for stock price tracking
  latestPrice?: number | null
  priceChangePercent?: number | null
  priceUpdatedAt?: Date | null
  exchange?: 'NSE' | 'BSE' | null
  token?: string | null
  status: 'upcoming' | 'open' | 'closed' | 'listed'
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IPOFormData {
  srNo: number
  name: string
  symbol: string
  dateRange?: string
  offerPrice?: string
  lotSize?: number
  type?: 'mainboard' | 'sme'
  subscription?: string
  listingPrice?: string
  exchange?: 'NSE' | 'BSE'
  token?: string
  status?: 'upcoming' | 'open' | 'closed' | 'listed'
  description?: string
}

export interface ExcelRowData {
  'Sr. No': string
  'IPO Name': string
  Symbol: string
  'Date Range'?: string
  'Offer Price'?: string
  'Lot Size'?: string
  Type?: string
  Subscription?: string
  'Listing Price'?: string
}

export type IPOStatus = IPO['status']
export type IPOType = NonNullable<IPO['type']>

// Stock Price API Response
export interface StockPriceResponse {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: string
}
