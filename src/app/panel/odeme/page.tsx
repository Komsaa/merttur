import { prisma } from "@/lib/prisma";
import OdemeClient from "./OdemeClient";
import { differenceInDays } from "date-fns";

async function getData() {
  const [contacts, transactions, checks] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { name: "asc" },
      include: {
        transactions: true,
        checks: { where: { status: "bekliyor" }, orderBy: { dueDate: "asc" } },
      },
    }).catch(() => []),
    prisma.contactTransaction.findMany({
      orderBy: { date: "desc" },
      include: { contact: { select: { id: true, name: true, type: true } } },
    }).catch(() => []),
    prisma.check.findMany({
      orderBy: { dueDate: "asc" },
      include: { contact: { select: { id: true, name: true } } },
    }).catch(() => []),
  ]);

  // Her cari için bakiye hesapla
  const contactBalances = contacts.map((c) => {
    // Alacak: bize borçlu olanlar (direction: alacak) - ödenmemişler
    const totalReceivable = c.transactions
      .filter((t) => t.direction === "alacak" && t.status !== "odendi" && t.status !== "iptal")
      .reduce((s, t) => s + t.amount - t.paidAmount, 0);

    // Borç: bize borç olanlar (direction: borc) - ödenmemişler
    const totalPayable = c.transactions
      .filter((t) => t.direction === "borc" && t.status !== "odendi" && t.status !== "iptal")
      .reduce((s, t) => s + t.amount - t.paidAmount, 0);

    // Gecikmiş alacaklar
    const overdueReceivable = c.transactions
      .filter((t) => {
        if (t.direction !== "alacak" || t.status === "odendi" || t.status === "iptal") return false;
        if (!t.dueDate) return false;
        return differenceInDays(new Date(), new Date(t.dueDate)) > 0;
      })
      .reduce((s, t) => s + t.amount - t.paidAmount, 0);

    return {
      ...c,
      totalReceivable,
      totalPayable,
      overdueReceivable,
      netBalance: totalReceivable - totalPayable,
      transactions: c.transactions.map((t) => ({
        ...t,
        contact: { id: c.id, name: c.name, type: c.type },
      })),
      checks: c.checks.map((ch) => ({
        ...ch,
        contact: { id: c.id, name: c.name },
      })),
    };
  });

  // Genel özet
  const summary = {
    totalReceivable: contactBalances.reduce((s, c) => s + c.totalReceivable, 0),
    totalPayable: contactBalances.reduce((s, c) => s + c.totalPayable, 0),
    overdueTotal: contactBalances.reduce((s, c) => s + c.overdueReceivable, 0),
    pendingChecksIn: checks
      .filter((c) => c.direction === "aldik" && c.status === "bekliyor")
      .reduce((s, c) => s + c.amount, 0),
    pendingChecksOut: checks
      .filter((c) => c.direction === "verdik" && c.status === "bekliyor")
      .reduce((s, c) => s + c.amount, 0),
    // Bu ay vadesi gelen çekler (7 gün içinde)
    urgentChecks: checks.filter((c) => {
      if (c.status !== "bekliyor") return false;
      const days = differenceInDays(new Date(c.dueDate), new Date());
      return days <= 7 && days >= 0;
    }),
  };

  return { contacts: contactBalances, transactions, checks, summary };
}

export default async function OdemePage() {
  try {
    const data = await getData();
    return <OdemeClient {...data} />;
  } catch (e) {
    console.error("Ödeme sayfa hatası:", e);
    const empty = { contacts: [], transactions: [], checks: [], summary: { totalReceivable: 0, totalPayable: 0, overdueTotal: 0, pendingChecksIn: 0, pendingChecksOut: 0, urgentChecks: [] } };
    return <OdemeClient {...empty} />;
  }
}
