const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const fs = require('fs')

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // Read Excel file
  const workbook = XLSX.readFile('ipo-data.xlsx')
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false })

  console.log(`Found ${data.length} rows in Excel file`)

  // Parse date range "Dec 22 - Dec 24, 2025"
  const parseDateRange = (dateRange) => {
    // Split by " - " to get start and end parts
    const parts = dateRange.split(' - ')
    const startPart = parts[0].trim() // "Dec 22"
    const endPart = parts[1] ? parts[1].trim() : startPart // "Dec 24, 2025"

    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    }

    const parseDate = (part, defaultYear) => {
      // Handle "Dec 24, 2025" or "Dec 22"
      const tokens = part.trim().split(' ')
      const month = tokens[0]
      const day = parseInt(tokens[1].replace(',', ''))
      // Year is either after comma in this part, or from the end part
      let year = defaultYear
      if (tokens.length > 2 && tokens[2]) {
        year = parseInt(tokens[2])
      }
      return new Date(year, months[month] || 0, day)
    }

    // Extract year from end part (e.g., "Dec 24, 2025")
    let year = new Date().getFullYear()
    const endTokens = endPart.split(' ')
    if (endTokens.length > 2) {
      year = parseInt(endTokens[2])
    }

    return {
      start: parseDate(startPart, year),
      end: parseDate(endPart, year)
    }
  }

  // Parse offer price "108-114"
  const parseOfferPrice = (price) => {
    const parts = price.split('-')
    const min = parseFloat(parts[0].trim())
    const max = parts[1] ? parseFloat(parts[1].trim()) : min
    return { min, max }
  }

  for (const row of data) {
    try {
      const dateRange = parseDateRange(row['Date Range'])
      const offerPrice = parseOfferPrice(row['Offer Price'])

      await prisma.iPO.create({
        data: {
          srNo: parseInt(row['Sr. No']),
          name: row['IPO Name'],
          symbol: row['Symbol'],
          dateRangeStart: dateRange.start,
          dateRangeEnd: dateRange.end,
          offerPriceMin: offerPrice.min,
          offerPriceMax: offerPrice.max,
          lotSize: parseInt(row['Lot Size']),
          type: row['Type'].toLowerCase(),
          subscription: row['Subscription'] ? parseFloat(row['Subscription']) : null,
          listingPrice: row['Listing Price'] ? parseFloat(row['Listing Price']) : null,
          status: 'upcoming'
        }
      })

      console.log(`✓ Created IPO: ${row['IPO Name']}`)
    } catch (error) {
      console.error(`✗ Error creating IPO ${row['IPO Name']}:`, error.message)
    }
  }

  console.log('🎉 Seeding completed!')
}

seed()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
