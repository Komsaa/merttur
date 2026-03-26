import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const routes = await prisma.route.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      driver: true,
      vehicle: true,
      stops: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const route = await prisma.route.create({
      data: {
        name: b.name,
        type: b.type || "okul",
        driverId: b.driverId || null,
        vehicleId: b.vehicleId || null,
        weekdaysOnly: b.weekdaysOnly !== false,
        active: b.active !== false,
        notes: b.notes || null,
        stops: {
          create: (b.stops || []).map((s: { name: string; lat?: number; lng?: number; estimatedTime: string; notes?: string }, i: number) => ({
            order: i,
            name: s.name,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
            estimatedTime: s.estimatedTime,
            notes: s.notes || null,
          })),
        },
      },
      include: { stops: { orderBy: { order: "asc" } }, driver: true, vehicle: true },
    });
    return NextResponse.json(route, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("POST /api/routes error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
