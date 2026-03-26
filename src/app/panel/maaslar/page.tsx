import { prisma } from "@/lib/prisma";
import SalaryClient from "./SalaryClient";

async function getData() {
  try {
    const [drivers, salaries] = await Promise.all([
      prisma.driver.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, phone: true },
      }).catch(() => []),
      prisma.salary.findMany({
        include: { driver: { select: { id: true, name: true } } },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }).catch(() => []),
    ]);
    return { drivers, salaries };
  } catch (e) {
    console.error("Maaşlar sayfa hatası:", e);
    return { drivers: [], salaries: [] };
  }
}

export default async function SalaryPage() {
  const data = await getData();
  return <SalaryClient {...data} />;
}
