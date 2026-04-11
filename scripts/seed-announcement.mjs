import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const existing = await prisma.announcement.findFirst({ where: { title: { contains: 'Cyclone Vaianu' } } })
if (!existing) {
  await prisma.announcement.create({
    data: {
      title: '⚠️ All Home Visits Suspended — Cyclone Vaianu',
      body: 'Due to Civil Defence emergency declarations across the North Island, all scheduled VetPac home visits are temporarily suspended.\n\nCyclone Vaianu is currently making landfall, with states of emergency declared in Northland, Auckland, Waikato, Coromandel, and Bay of Plenty. Civil Defence is advising all residents to stay indoors and off the roads.\n\nThe safety of our customers, their families, and our team comes first.\n\nAll affected customers will be contacted directly to reschedule at no extra cost. We expect to resume normal operations once Civil Defence advisories are lifted.\n\nStay safe, and keep your puppies inside.',
      startAt: new Date('2026-04-10T23:00:00Z'),
      endAt: new Date('2026-04-12T23:00:00Z'),
    },
  })
  console.log('Cyclone Vaianu announcement seeded.')
} else {
  console.log('Already exists, skipping.')
}

await prisma.$disconnect()
