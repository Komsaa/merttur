import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDate(s: string | undefined | null) {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const drivers = await prisma.driver.findMany({ orderBy: { name: "asc" }, include: { vehicle: true } });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        phone: body.phone || null,
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
        status: body.status || "active",
      },
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
