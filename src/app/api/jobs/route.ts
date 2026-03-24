import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.job.findMany({ orderBy: [{ date: "desc" }, { startTime: "asc" }], include: { driver: true, vehicle: true } }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const job = await prisma.job.create({
      data: {
        title: b.title,
        type: b.type || "okul",
        clientName: b.clientName || null,
        date: new Date(b.date),
        startTime: b.startTime,
        endTime: b.endTime || null,
        driverId: b.driverId || null,
        vehicleId: b.vehicleId || null,
        route: b.route || null,
        revenue: b.revenue ? parseFloat(b.revenue) : null,
        status: b.status || "planned",
        notes: b.notes || null,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
