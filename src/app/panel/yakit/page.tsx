import { prisma } from "@/lib/prisma";
import FuelClient from "./FuelClient";
import { startOfMonth, endOfMonth } from "date-fns";

async function getData() {
  const now = new Date();
  const [fuelEntries, vehicles, drivers, monthStats] = await Promise.all([
    prisma.fuelEntry.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { vehicle: true, driver: true },
    }),
    prisma.vehicle.findMany({ where: { status: "active" }, orderBy: { plate: "asc" }, select: { id: true, plate: true, brand: true, model: true } }),
    prisma.driver.findMany({ where: { status: "active" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.fuelEntry.groupBy({
      by: ["vehicleId"],
      _sum: { totalAmount: true, liters: true },
      where: { date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
  ]);
  return { fuelEntries, vehicles, drivers, monthStats };
}

export default async function FuelPage() {
  const data = await getData();
  return <FuelClient {...data} />;
}
