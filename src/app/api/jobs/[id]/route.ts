import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...(b.title && { title: b.title }),
        ...(b.type && { type: b.type }),
        ...(b.status && { status: b.status }),
        ...(b.date && { date: new Date(b.date) }),
        ...(b.startTime && { startTime: b.startTime }),
        endTime: b.endTime || null,
        clientName: b.clientName || null,
        driverId: b.driverId || null,
        vehicleId: b.vehicleId || null,
        route: b.route || null,
        revenue: b.revenue ? parseFloat(b.revenue) : null,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(job);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
