import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const card = await prisma.creditCard.update({
      where: { id: params.id },
      data: {
        name: b.name,
        bank: b.bank || null,
        lastFour: b.lastFour || null,
        limit: b.limit ? parseFloat(b.limit) : null,
        billingDay: parseInt(b.billingDay) || 1,
        paymentDaysAfterBilling: parseInt(b.paymentDaysAfterBilling) || 10,
        color: b.color || "#1B2437",
        active: b.active !== false,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(card);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.creditCard.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
