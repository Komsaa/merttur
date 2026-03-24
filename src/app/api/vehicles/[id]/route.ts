import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pd(s: string | undefined | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        plate: b.plate?.toUpperCase().trim(),
        brand: b.brand || null,
        model: b.model || null,
        year: b.year ? parseInt(b.year) : null,
        capacity: b.capacity ? parseInt(b.capacity) : null,
        status: b.status || undefined,
        insuranceCompany: b.insuranceCompany || null,
        insurancePolicyNo: b.insurancePolicyNo || null,
        routePermitNumber: b.routePermitNumber || null,
        inspectionExpiry: pd(b.inspectionExpiry),
        insuranceExpiry: pd(b.insuranceExpiry),
        routePermitExpiry: pd(b.routePermitExpiry),
        approvalExpiry: pd(b.approvalExpiry),
        kaskoExpiry: pd(b.kaskoExpiry),
        plateAuthExpiry: pd(b.plateAuthExpiry),
        notes: b.notes || null,
      },
    });
    return NextResponse.json(vehicle);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.vehicle.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
