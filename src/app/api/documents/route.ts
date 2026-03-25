import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const docs = await prisma.document.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const doc = await prisma.document.create({
      data: {
        name: b.name,
        expiry: b.expiry ? new Date(b.expiry) : null,
        fileUrl: b.fileUrl || null,
        notes: b.notes || null,
        entityType: b.entityType,
        entityId: b.entityId,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
