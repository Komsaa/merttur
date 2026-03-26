// Bu dosya Next.js 14 tarafından sunucu başladığında otomatik çalıştırılır.
// Prisma db push olmadan eksik DB kolonlarını/tablolarını ekler.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { prisma } = await import("@/lib/prisma");

    // Bağlantıyı test et
    await prisma.$connect();

    // ── Vehicle tablosu yeni kolonlar ──────────────────────────────────
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "ruhsatFile" TEXT`
    ).catch(() => {});

    // ── Route tablosu ─────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Route" (
        "id"           TEXT        NOT NULL,
        "name"         TEXT        NOT NULL,
        "type"         TEXT        NOT NULL DEFAULT 'okul',
        "driverId"     TEXT,
        "vehicleId"    TEXT,
        "weekdaysOnly" BOOLEAN     NOT NULL DEFAULT true,
        "active"       BOOLEAN     NOT NULL DEFAULT true,
        "notes"        TEXT,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
      )
    `).catch(() => {});

    // ── RouteStop tablosu ──────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RouteStop" (
        "id"            TEXT     NOT NULL,
        "routeId"       TEXT     NOT NULL,
        "order"         INTEGER  NOT NULL,
        "name"          TEXT     NOT NULL,
        "lat"           DOUBLE PRECISION,
        "lng"           DOUBLE PRECISION,
        "estimatedTime" TEXT     NOT NULL,
        "notes"         TEXT,
        CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
      )
    `).catch(() => {});

    // RouteStop → Route foreign key
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'RouteStop_routeId_fkey'
        ) THEN
          ALTER TABLE "RouteStop"
            ADD CONSTRAINT "RouteStop_routeId_fkey"
            FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE;
        END IF;
      END $$
    `).catch(() => {});

    // ── CreditCard tablosu ─────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditCard" (
        "id"                     TEXT        NOT NULL,
        "name"                   TEXT        NOT NULL,
        "bank"                   TEXT,
        "lastFour"               TEXT,
        "limit"                  DOUBLE PRECISION,
        "billingDay"             INTEGER     NOT NULL,
        "paymentDaysAfterBilling" INTEGER    NOT NULL,
        "color"                  TEXT        NOT NULL DEFAULT '#1B2437',
        "active"                 BOOLEAN     NOT NULL DEFAULT true,
        "notes"                  TEXT,
        "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
      )
    `).catch(() => {});

    // ── CreditCardExpense tablosu ──────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditCardExpense" (
        "id"           TEXT     NOT NULL,
        "cardId"       TEXT     NOT NULL,
        "amount"       DOUBLE PRECISION NOT NULL,
        "date"         TIMESTAMP(3) NOT NULL,
        "description"  TEXT     NOT NULL,
        "category"     TEXT     NOT NULL DEFAULT 'diger',
        "merchant"     TEXT,
        "receiptPhoto" TEXT,
        "billingMonth" INTEGER  NOT NULL,
        "billingYear"  INTEGER  NOT NULL,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CreditCardExpense_pkey" PRIMARY KEY ("id")
      )
    `).catch(() => {});

    // CreditCardExpense → CreditCard foreign key
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'CreditCardExpense_cardId_fkey'
        ) THEN
          ALTER TABLE "CreditCardExpense"
            ADD CONSTRAINT "CreditCardExpense_cardId_fkey"
            FOREIGN KEY ("cardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE;
        END IF;
      END $$
    `).catch(() => {});

    // ── ContactTransaction yeni kolon ──────────────────────────────────
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ContactTransaction" ADD COLUMN IF NOT EXISTS "paymentPriority" INTEGER NOT NULL DEFAULT 2`
    ).catch(() => {});

    console.log("[MertTur] DB schema sync tamamlandı ✓");
  } catch (e) {
    console.error("[MertTur] DB schema sync hatası:", e);
  }
}
