import { prisma } from "@/lib/prisma";
import TasksClient from "./TasksClient";
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subMonths,
} from "date-fns";

async function getData() {
  const now = new Date();
  try {
    const [tasks, vehicles, drivers] = await Promise.all([
      prisma.task.findMany({ orderBy: [{ status: "asc" }, { dueDate: "asc" }] }).catch(() => []),
      prisma.vehicle.findMany({ where: { status: "active" }, select: { id: true, plate: true } }).catch(() => []),
      prisma.driver.findMany({ where: { status: "active" }, select: { id: true, name: true } }).catch(() => []),
    ]);

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const q3Start = subMonths(now, 3);

    function inRange(t: typeof tasks[0], start: Date, end: Date) {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= start && d <= end;
    }

    const summaries = {
      daily: {
        total: tasks.filter((t) => inRange(t, todayStart, todayEnd)).length,
        done: tasks.filter((t) => inRange(t, todayStart, todayEnd) && t.status === "done").length,
        pending: tasks.filter((t) => inRange(t, todayStart, todayEnd) && t.status === "pending").length,
        overdue: tasks.filter((t) => {
          if (!t.dueDate || t.status === "done" || t.status === "cancelled") return false;
          return new Date(t.dueDate) < todayStart;
        }).length,
      },
      weekly: {
        total: tasks.filter((t) => inRange(t, weekStart, weekEnd)).length,
        done: tasks.filter((t) => inRange(t, weekStart, weekEnd) && t.status === "done").length,
        pending: tasks.filter((t) => inRange(t, weekStart, weekEnd) && t.status === "pending").length,
      },
      monthly: {
        total: tasks.filter((t) => inRange(t, monthStart, monthEnd)).length,
        done: tasks.filter((t) => inRange(t, monthStart, monthEnd) && t.status === "done").length,
        pending: tasks.filter((t) => inRange(t, monthStart, monthEnd) && t.status === "pending").length,
      },
      quarterly: {
        total: tasks.filter((t) => inRange(t, q3Start, now)).length,
        done: tasks.filter((t) => inRange(t, q3Start, now) && t.status === "done").length,
        pending: tasks.filter((t) => inRange(t, q3Start, now) && t.status === "pending").length,
      },
    };

    return { tasks, vehicles, drivers, summaries };
  } catch (e) {
    console.error("Görevler sayfa hatası:", e);
    const emptySummary = { total: 0, done: 0, pending: 0 };
    return { tasks: [], vehicles: [], drivers: [], summaries: { daily: { ...emptySummary, overdue: 0 }, weekly: emptySummary, monthly: emptySummary, quarterly: emptySummary } };
  }
}

export default async function TasksPage() {
  const data = await getData();
  return <TasksClient {...data} />;
}
