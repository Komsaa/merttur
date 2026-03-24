import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pd(s: string | undefined | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.vehicle.findMany({ orderBy: { plate: "asc" } }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const vehicle = await prisma.vehicle.create({
      data: {
        plate: b.plate.toUpperCase().trim(),
        brand: b.brand || null,
        model: b.model || null,
        year: b.year ? parseInt(b.year) : null,
        capacity: b.capacity ? parseInt(b.capacity) : null,
        color: b.color || "Sarı",
        status: "active",
        inspectionExpiry: pd(b.inspectionExpiry),
        insuranceExpiry: pd(b.insuranceExpiry),
        routePermitExpiry: pd(b.routePermitExpiry),
        approvalExpiry: pd(b.approvalExpiry),
        kaskoExpiry: pd(b.kaskoExpiry),
        plateAuthExpiry: pd(b.plateAuthExpiry),
        notes: b.notes || null,
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Bu plaka zaten kayıtlı" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
