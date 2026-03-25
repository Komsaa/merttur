import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where = {
    ...(month && { month: parseInt(month) }),
    ...(year && { year: parseInt(year) }),
  };

  const salaries = await prisma.salary.findMany({
    where,
    include: { driver: { select: { id: true, name: true, phone: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }, { driver: { name: "asc" } }],
  });

  return NextResponse.json(salaries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const salary = await prisma.salary.upsert({
      where: {
        driverId_month_year: {
          driverId: b.driverId,
          month: parseInt(b.month),
          year: parseInt(b.year),
        },
      },
      update: {
        baseAmount: parseFloat(b.baseAmount) || 0,
        bonusAmount: parseFloat(b.bonusAmount) || 0,
        totalAmount: (parseFloat(b.baseAmount) || 0) + (parseFloat(b.bonusAmount) || 0),
        paid: b.paid ?? false,
        notes: b.notes || null,
      },
      create: {
        driverId: b.driverId,
        month: parseInt(b.month),
        year: parseInt(b.year),
        baseAmount: parseFloat(b.baseAmount) || 0,
        bonusAmount: parseFloat(b.bonusAmount) || 0,
        totalAmount: (parseFloat(b.baseAmount) || 0) + (parseFloat(b.bonusAmount) || 0),
        paid: b.paid ?? false,
        notes: b.notes || null,
      },
      include: { driver: { select: { id: true, name: true } } },
    });
    return NextResponse.json(salary, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
