import { prisma } from "@/lib/prisma";
import FuelClient from "./FuelClient";
import { startOfMonth, endOfMonth } from "date-fns";

async function getData() {
  const now = new Date();
  try {
    const [fuelEntries, vehicles, drivers, monthStats] = await Promise.all([
      prisma.fuelEntry.findMany({
        orderBy: { date: "desc" },
        take: 100,
        include: { vehicle: true, driver: true },
      }).catch(async () =>
        (await prisma.fuelEntry.findMany({ orderBy: { date: "desc" }, take: 100 }).catch(() => []))
          .map((e) => ({ ...e, vehicle: null as any, driver: null as any }))
      ),
      prisma.vehicle.findMany({ where: { status: "active" }, orderBy: { plate: "asc" }, select: { id: true, plate: true, brand: true, model: true } }).catch(() => []),
      prisma.driver.findMany({ where: { status: "active" }, orderBy: { name: "asc" }, select: { id: true, name: true } }).catch(() => []),
      prisma.fuelEntry.groupBy({
        by: ["vehicleId"],
        _sum: { totalAmount: true, liters: true },
        where: { date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      }).catch(() => []),
    ]);
    return { fuelEntries, vehicles, drivers, monthStats };
  } catch (e) {
    console.error("Yakıt sayfa hatası:", e);
    return { fuelEntries: [], vehicles: [], drivers: [], monthStats: [] };
  }
}

export default async function FuelPage() {
  const data = await getData();
  return <FuelClient {...data} />;
}
