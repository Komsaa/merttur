import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const txns = await prisma.contactTransaction.findMany({
    orderBy: { date: "desc" },
    include: { contact: { select: { id: true, name: true, type: true } } },
  });
  return NextResponse.json(txns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const txn = await prisma.contactTransaction.create({
      data: {
        contactId: b.contactId,
        type: b.type,
        direction: b.direction,
        amount: parseFloat(b.amount),
        paidAmount: b.paidAmount ? parseFloat(b.paidAmount) : 0,
        date: new Date(b.date),
        dueDate: b.dueDate ? new Date(b.dueDate) : null,
        status: b.status || "bekliyor",
        description: b.description || null,
        invoiceNo: b.invoiceNo || null,
        category: b.category || null,
        paymentPriority: b.paymentPriority ? parseInt(b.paymentPriority) : 2,
      },
      include: { contact: true },
    });
    return NextResponse.json(txn, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
