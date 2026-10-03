import { PrismaClient } from '@prisma/client'
import { statSync } from 'fs'
import { join } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaMtime: number | undefined
}

// Версия клиента определяется mtime сгенерированной схемы:
// после `prisma db push` и регенерации клиента глобальный кэш
// инвалидируется автоматически, без перезапуска dev-сервера.
function schemaMtime(): number {
  try {
    return statSync(
      join(process.cwd(), 'node_modules', '.prisma', 'client', 'schema.prisma')
    ).mtimeMs
  } catch {
    return 0
  }
}

function getDb(): PrismaClient {
  const mtime = schemaMtime()
  if (globalForPrisma.prisma && globalForPrisma.prismaSchemaMtime === mtime) {
    return globalForPrisma.prisma
  }
  if (globalForPrisma.prisma) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      /* клиент уже мёртв — просто заменим */
    }
  }
  const client = new PrismaClient({
    log: ['query'],
  })
  globalForPrisma.prisma = client
  globalForPrisma.prismaSchemaMtime = mtime
  return client
}

export const db = getDb()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
