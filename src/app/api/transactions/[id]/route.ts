import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const txn = await prisma.contactTransaction.update({
      where: { id: params.id },
      data: {
        ...(b.status !== undefined && { status: b.status }),
        ...(b.paidAmount !== undefined && { paidAmount: parseFloat(b.paidAmount) }),
        ...(b.description !== undefined && { description: b.description }),
        ...(b.dueDate !== undefined && { dueDate: b.dueDate ? new Date(b.dueDate) : null }),
        ...(b.amount !== undefined && { amount: parseFloat(b.amount) }),
        ...(b.invoiceNo !== undefined && { invoiceNo: b.invoiceNo }),
      },
    });
    return NextResponse.json(txn);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.contactTransaction.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
