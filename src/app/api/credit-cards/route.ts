import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cards = await prisma.creditCard.findMany({ orderBy: { createdAt: "asc" } }).catch(() => []);
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const card = await prisma.creditCard.create({
      data: {
        name: b.name,
        bank: b.bank || null,
        lastFour: b.lastFour || null,
        limit: b.limit ? parseFloat(b.limit) : null,
        billingDay: parseInt(b.billingDay) || 1,
        paymentDaysAfterBilling: parseInt(b.paymentDaysAfterBilling) || 10,
        color: b.color || "#1B2437",
        notes: b.notes || null,
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("POST /api/credit-cards:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
