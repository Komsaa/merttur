import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import JobsClient from "./JobsClient";

async function getData() {
  try {
    const [jobs, drivers, vehicles] = await Promise.all([
      prisma.job.findMany({
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        include: { driver: true, vehicle: true },
        take: 200,
      }).catch(async () => {
        // vehicle include başarısız olursa ilişkisiz çek
        const jobs = await prisma.job.findMany({
          orderBy: [{ date: "desc" }, { startTime: "asc" }],
          take: 200,
        }).catch(() => []);
        return jobs.map((j) => ({ ...j, driver: null, vehicle: null }));
      }),
      prisma.driver.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }).catch(() => []),
      prisma.vehicle.findMany({
        where: { status: "active" },
        orderBy: { plate: "asc" },
        select: { id: true, plate: true, brand: true, model: true },
      }).catch(() => []),
    ]);
    return { jobs, drivers, vehicles };
  } catch (e) {
    console.error("İşler sayfa hatası:", e);
    return { jobs: [], drivers: [], vehicles: [] };
  }
}

export default async function JobsPage() {
  const data = await getData();
  return <JobsClient {...data} />;
}
