import { PrismaClient } from '@prisma/client'
import { VALID_WORDS } from '../data/word-database'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  // Clean up existing dictionary if needed (optional)
  // await prisma.dictionary.deleteMany({})

  const wordsToInsert = VALID_WORDS.map(word => ({
    word: word.toLowerCase()
  }))

  for (const wordData of wordsToInsert) {
    await prisma.dictionary.upsert({
      where: { word: wordData.word },
      update: {},
      create: wordData,
    })
  }

  console.log(`Seeded ${wordsToInsert.length} words into the dictionary.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
