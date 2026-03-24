import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    orderBy: [
      { status: "asc" }, // pending önce
      { dueDate: "asc" },
      { priority: "asc" },
    ],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const task = await prisma.task.create({
      data: {
        title: b.title,
        description: b.description || null,
        category: b.category || "diger",
        priority: b.priority || "normal",
        dueDate: b.dueDate ? new Date(b.dueDate) : null,
        dueTime: b.dueTime || null,
        recurrence: b.recurrence || "none",
        vehicleId: b.vehicleId || null,
        driverId: b.driverId || null,
        notes: b.notes || null,
        status: "pending",
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
