import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const date = new Date(b.date);
    const expense = await prisma.creditCardExpense.create({
      data: {
        cardId: b.cardId,
        amount: parseFloat(b.amount),
        date,
        description: b.description,
        category: b.category || "diger",
        merchant: b.merchant || null,
        receiptPhoto: b.receiptPhoto || null,
        billingMonth: b.billingMonth || date.getMonth() + 1,
        billingYear: b.billingYear || date.getFullYear(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("POST /api/credit-card-expenses:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
