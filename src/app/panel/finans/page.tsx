import { prisma } from "@/lib/prisma";
import FinanceClient from "./FinanceClient";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

async function getData() {
  const now = new Date();
  const [entries, fuelEntries, drivers] = await Promise.all([
    prisma.financeEntry.findMany({
      orderBy: { date: "desc" },
      take: 200,
    }),
    // Yakıt verilerini de finansa dahil et
    prisma.fuelEntry.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: { vehicle: true },
    }),
    prisma.driver.findMany({
      where: { status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Son 6 ayın aylık özeti
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(now, i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const income = entries.filter((e) => e.type === "income" && new Date(e.date) >= start && new Date(e.date) <= end).reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === "expense" && new Date(e.date) >= start && new Date(e.date) <= end).reduce((s, e) => s + e.amount, 0);
    const fuel = fuelEntries.filter((e) => new Date(e.date) >= start && new Date(e.date) <= end).reduce((s, e) => s + e.totalAmount, 0);
    monthlyData.push({
      month: month.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
      income,
      expense: expense + fuel,
      fuel,
    });
  }

  return { entries, fuelEntries, drivers, monthlyData };
}

export default async function FinancePage() {
  const data = await getData();
  return <FinanceClient {...data} />;
}
