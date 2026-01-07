const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const iposToAdd = [
  {
    name: "Yajur Fibres Limited IPO",
    symbol: null,
    exchange: "BSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-07"),
    dateRangeEnd: new Date("2026-01-09"),
    offerPriceMin: 168,
    offerPriceMax: 174,
    lotSize: 1600,
    status: "upcoming"
  },
  {
    name: "Victory Electric Vehicles International Limited IPO",
    symbol: null,
    exchange: "NSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-07"),
    dateRangeEnd: new Date("2026-01-09"),
    offerPriceMin: 41,
    offerPriceMax: 41,
    lotSize: 6000,
    status: "upcoming"
  },
  {
    name: "Defrail Technologies Limited IPO",
    symbol: null,
    exchange: "NSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-09"),
    dateRangeEnd: new Date("2026-01-13"),
    offerPriceMin: 70,
    offerPriceMax: 74,
    lotSize: 3200,
    status: "upcoming"
  },
  {
    name: "Avana Electrosystems Limited IPO",
    symbol: null,
    exchange: "NSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-12"),
    dateRangeEnd: new Date("2026-01-14"),
    offerPriceMin: 56,
    offerPriceMax: 59,
    lotSize: 4000,
    status: "upcoming"
  },
  {
    name: "Narmadesh Brass Industries Limited IPO",
    symbol: null,
    exchange: "BSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-12"),
    dateRangeEnd: new Date("2026-01-15"),
    offerPriceMin: 515,
    offerPriceMax: 515,
    lotSize: 480,
    status: "upcoming"
  },
  {
    name: "INDO SMC Limited IPO",
    symbol: null,
    exchange: "BSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-13"),
    dateRangeEnd: new Date("2026-01-15"),
    offerPriceMin: 141,
    offerPriceMax: 149,
    lotSize: 2000,
    status: "upcoming"
  },
  {
    name: "GRE Renew Enertech",
    symbol: null,
    exchange: "BSE",
    type: "sme",
    dateRangeStart: new Date("2026-01-13"),
    dateRangeEnd: new Date("2026-01-16"),
    offerPriceMin: 100,
    offerPriceMax: 105,
    lotSize: 2400,
    status: "upcoming"
  }
]

async function addIPOs() {
  try {
    // Get current max Sr No
    const maxSrNo = await prisma.iPO.findFirst({
      orderBy: { srNo: 'desc' },
      select: { srNo: true }
    })

    let currentSrNo = maxSrNo ? maxSrNo.srNo + 1 : 1

    for (const ipo of iposToAdd) {
      // Check if IPO already exists
      const existing = await prisma.iPO.findFirst({
        where: {
          name: ipo.name
        }
      })

      if (existing) {
        console.log(`⚠️  Skipping "${ipo.name}" - already exists`)
        continue
      }

      // Create IPO with Sr No
      await prisma.iPO.create({
        data: {
          ...ipo,
          srNo: currentSrNo++
        }
      })

      console.log(`✅ Added: ${ipo.name}`)
    }

    console.log('\n✨ All IPOs added successfully!')
  } catch (error) {
    console.error('Error adding IPOs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addIPOs()
