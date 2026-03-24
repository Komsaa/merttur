import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import JobsClient from "./JobsClient";

async function getData() {
  const [jobs, drivers, vehicles] = await Promise.all([
    prisma.job.findMany({
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      include: { driver: true, vehicle: true },
      take: 200,
    }),
    prisma.driver.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.vehicle.findMany({
      where: { status: "active" },
      orderBy: { plate: "asc" },
      select: { id: true, plate: true, brand: true, model: true },
    }),
  ]);
  return { jobs, drivers, vehicles };
}

export default async function JobsPage() {
  const data = await getData();
  return <JobsClient {...data} />;
}
