import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDate(s: string | undefined | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = await prisma.driver.findUnique({ where: { id: params.id }, include: { vehicle: true } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(driver);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        phone: body.phone || null,
        status: body.status || undefined,
        licenseClass: body.licenseClass || null,
        licenseNumber: body.licenseNumber || null,
        licenseExpiry: parseDate(body.licenseExpiry),
        srcExpiry: parseDate(body.srcExpiry),
        psychotechExpiry: parseDate(body.psychotechExpiry),
        criminalRecordDate: parseDate(body.criminalRecordDate),
        criminalRecordExpiry: parseDate(body.criminalRecordExpiry),
        healthReportExpiry: parseDate(body.healthReportExpiry),
        address: body.address || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(driver);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.driver.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
