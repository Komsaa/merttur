import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();

    // Tamamlandı işareti
    const completedAt =
      b.status === "done" && !b.keepCompletedAt
        ? new Date()
        : b.status !== "done"
        ? null
        : undefined;

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(b.title !== undefined && { title: b.title }),
        ...(b.description !== undefined && { description: b.description || null }),
        ...(b.category !== undefined && { category: b.category }),
        ...(b.priority !== undefined && { priority: b.priority }),
        ...(b.status !== undefined && { status: b.status }),
        ...(b.dueDate !== undefined && { dueDate: b.dueDate ? new Date(b.dueDate) : null }),
        ...(b.dueTime !== undefined && { dueTime: b.dueTime || null }),
        ...(b.recurrence !== undefined && { recurrence: b.recurrence }),
        ...(b.notes !== undefined && { notes: b.notes || null }),
        ...(completedAt !== undefined && { completedAt }),
        ...(b.completedBy !== undefined && { completedBy: b.completedBy || null }),
      },
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
