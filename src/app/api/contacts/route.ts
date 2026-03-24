import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    orderBy: { name: "asc" },
    include: {
      transactions: { select: { direction: true, amount: true, paidAmount: true, status: true } },
      checks: { select: { direction: true, amount: true, status: true, dueDate: true } },
    },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const contact = await prisma.contact.create({
      data: {
        name: b.name,
        type: b.type || "musteri",
        phone: b.phone || null,
        email: b.email || null,
        address: b.address || null,
        taxNo: b.taxNo || null,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
