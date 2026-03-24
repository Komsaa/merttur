import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.financeEntry.findMany({ orderBy: { date: "desc" } }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const entry = await prisma.financeEntry.create({
      data: {
        type: b.type,
        category: b.category,
        amount: parseFloat(b.amount),
        date: new Date(b.date),
        description: b.description || null,
        vehicleId: b.vehicleId || null,
        driverId: b.driverId || null,
        invoiceNo: b.invoiceNo || null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
