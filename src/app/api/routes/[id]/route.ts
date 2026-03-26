import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const route = await prisma.route.findUnique({
    where: { id: params.id },
    include: { stops: { orderBy: { order: "asc" } }, driver: true, vehicle: true },
  });
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(route);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();

    // Durağı toplu yenile
    await prisma.routeStop.deleteMany({ where: { routeId: params.id } });

    const route = await prisma.route.update({
      where: { id: params.id },
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
    return NextResponse.json(route);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("PUT /api/routes error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.route.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
