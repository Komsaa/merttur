import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const check = await prisma.check.update({
      where: { id: params.id },
      data: {
        ...(b.status !== undefined && { status: b.status }),
        ...(b.notes !== undefined && { notes: b.notes }),
        ...(b.bankName !== undefined && { bankName: b.bankName }),
        ...(b.checkNo !== undefined && { checkNo: b.checkNo }),
        ...(b.amount !== undefined && { amount: parseFloat(b.amount) }),
        ...(b.dueDate !== undefined && { dueDate: new Date(b.dueDate) }),
        ...(b.contactId !== undefined && { contactId: b.contactId || null }),
      },
    });
    return NextResponse.json(check);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.check.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
