import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.fuelEntry.findMany({ orderBy: { date: "desc" }, include: { vehicle: true, driver: true } }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const entry = await prisma.fuelEntry.create({
      data: {
        vehicleId: b.vehicleId,
        driverId: b.driverId || null,
        date: new Date(b.date),
        liters: parseFloat(b.liters),
        pricePerLiter: b.pricePerLiter ? parseFloat(b.pricePerLiter) : null,
        totalAmount: parseFloat(b.totalAmount),
        odometer: b.odometer ? parseInt(b.odometer) : null,
        station: b.station || null,
        paymentType: b.paymentType || "veresiye",
        notes: b.notes || null,
        parsedFrom: b.parsedFrom || "manual",
        rawText: b.rawText || null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
