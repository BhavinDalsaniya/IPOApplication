const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addIPO() {
  try {
    const ipo = await prisma.iPO.create({
      data: {
        srNo: 2,
        name: "Modern Diagnostic & Research Centre",
        symbol: null,
        exchange: "BSE",
        type: "sme",
        dateRangeStart: new Date("2025-12-31"),
        dateRangeEnd: new Date("2026-01-02"),
        offerPriceMin: 85,
        offerPriceMax: 90,
        lotSize: 3200,
        status: "upcoming"
      }
    })
    console.log('IPO created successfully:', ipo)
  } catch (error) {
    console.error('Error creating IPO:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addIPO()
