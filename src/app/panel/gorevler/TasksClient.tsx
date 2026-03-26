"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, X, CheckCircle2, Circle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Trash2, Edit2, RotateCcw,
  CalendarDays, Calendar, CalendarRange, BarChart3,
  Filter, Flag,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { differenceInDays, isToday, isTomorrow, isPast, format } from "date-fns";
import { tr } from "date-fns/locale";

// ============ SABITLER ============
const CATEGORIES = {
  evrak: { label: "Evrak İşleri", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", icon: "📄" },
  sanayi: { label: "Sanayi / Bakım", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", icon: "🔧" },
  muhasebe: { label: "Muhasebe / Fatura", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", icon: "💰" },
  sigorta: { label: "Sigorta", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500", icon: "🛡️" },
  toplanti: { label: "Toplantı / Görüşme", color: "bg-teal-100 text-teal-700 border-teal-200", dot: "bg-teal-500", icon: "🤝" },
  arac: { label: "Araç İşleri", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: "🚌" },
  diger: { label: "Diğer", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", icon: "📌" },
} as const;

const PRIORITIES = {
  low: { label: "Düşük", color: "text-slate-400", icon: "↓" },
  normal: { label: "Normal", color: "text-blue-500", icon: "→" },
  high: { label: "Yüksek", color: "text-amber-500", icon: "↑" },
  urgent: { label: "Acil", color: "text-red-600", icon: "🔴" },
} as const;

const RECURRENCES = {
  none: "Tekrar Etmez",
  daily: "Her Gün",
  weekly: "Her Hafta",
  monthly: "Her Ay",
  quarterly: "Her 3 Ayda Bir",
} as const;

// ============ TİPLER ============
type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  dueDate: Date | null;
  dueTime: string | null;
  recurrence: string | null;
  status: string;
  completedAt: Date | null;
  notes: string | null;
  vehicleId: string | null;
  driverId: string | null;
};

type Summary = {
  total: number;
  done: number;
  pending: number;
  overdue?: number;
};

interface Props {
  tasks: Task[];
  vehicles: { id: string; plate: string }[];
  drivers: { id: string; name: string }[];
  summaries: {
    daily: Summary;
    weekly: Summary;
    monthly: Summary;
    quarterly: Summary;
  };
}

const emptyForm = {
  title: "",
  description: "",
  category: "evrak",
  priority: "normal",
  dueDate: "",
  dueTime: "",
  recurrence: "none",
  vehicleId: "",
  driverId: "",
  notes: "",
};

// ============ YARDIMCI ============
function getDueDateLabel(dueDate: Date | null | undefined): {
  label: string;
  color: string;
} {
  if (!dueDate) return { label: "", color: "" };
  const d = new Date(dueDate);
  const daysLeft = differenceInDays(d, new Date());
  if (isPast(d) && !isToday(d)) return { label: `${Math.abs(daysLeft)} gün geçti`, color: "text-red-600 font-bold" };
  if (isToday(d)) return { label: "Bugün", color: "text-red-600 font-bold" };
  if (isTomorrow(d)) return { label: "Yarın", color: "text-amber-600 font-semibold" };
  if (daysLeft <= 7) return { label: `${daysLeft} gün kaldı`, color: "text-amber-600" };
  return { label: format(d, "d MMM", { locale: tr }), color: "text-slate-400" };
}

// ============ ANA BİLEŞEN ============
export default function TasksClient({ tasks: initialTasks, vehicles, drivers, summaries }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending"); // pending, done, all
  const [activeView, setActiveView] = useState<"daily" | "weekly" | "monthly" | "quarterly">("daily");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  function openAdd() {
    setEditTask(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      dueTime: task.dueTime ?? "",
      recurrence: task.recurrence ?? "none",
      vehicleId: task.vehicleId ?? "",
      driverId: task.driverId ?? "",
      notes: task.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Görev adı zorunlu"); return; }
    setLoading(true);
    try {
      const url = editTask ? `/api/tasks/${editTask.id}` : "/api/tasks";
      const method = editTask ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editTask ? "Güncellendi!" : "Görev eklendi!");
      setShowModal(false);
      router.refresh();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === "done" ? "pending" : "done";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(newStatus === "done" ? "✅ Tamamlandı!" : "↩️ Geri alındı");
      router.refresh();
    } catch { toast.error("Güncellenemedi"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu görev silinsin mi?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  // Filtreleme
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (filterStatus === "pending" && t.status === "done") return false;
      if (filterStatus === "done" && t.status !== "done") return false;
      return true;
    });
  }, [tasks, filterCat, filterStatus]);

  // Gruplama: Bugün / Bu Hafta / Bu Ay / Daha Sonra / Tarihi Yok / Geçmiş
  const grouped = useMemo(() => {
    const now = new Date();
    const groups: Record<string, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      this_week: [],
      later: [],
      no_date: [],
      done: [],
    };
    for (const t of filtered) {
      if (t.status === "done") { groups.done.push(t); continue; }
      if (!t.dueDate) { groups.no_date.push(t); continue; }
      const d = new Date(t.dueDate);
      const diff = differenceInDays(d, now);
      if (isPast(d) && !isToday(d)) groups.overdue.push(t);
      else if (isToday(d)) groups.today.push(t);
      else if (isTomorrow(d)) groups.tomorrow.push(t);
      else if (diff <= 7) groups.this_week.push(t);
      else groups.later.push(t);
    }
    return groups;
  }, [filtered]);

  const groupLabels = {
    overdue: { label: "⚠️ Gecikmiş", color: "text-red-600" },
    today: { label: "📅 Bugün", color: "text-red-500" },
    tomorrow: { label: "🌅 Yarın", color: "text-amber-600" },
    this_week: { label: "📆 Bu Hafta", color: "text-blue-600" },
    later: { label: "🗓️ Daha Sonra", color: "text-slate-600" },
    no_date: { label: "📌 Tarihi Belirsiz", color: "text-slate-400" },
    done: { label: "✅ Tamamlananlar", color: "text-green-600" },
  };

  const currentSummary = summaries[activeView];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Görevlerim</h1>
          <p className="text-slate-500 text-sm mt-1">
            {tasks.filter((t) => t.status === "pending").length} bekleyen görev
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Görev Ekle
        </button>
      </div>

      {/* ===== ÖZET KARTLARI ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Dönem seçici */}
        <div className="flex border-b border-slate-100">
          {(["daily", "weekly", "monthly", "quarterly"] as const).map((v) => {
            const icons = { daily: CalendarDays, weekly: Calendar, monthly: CalendarRange, quarterly: BarChart3 };
            const labels = { daily: "Günlük", weekly: "Haftalık", monthly: "Aylık", quarterly: "3 Aylık" };
            const Icon = icons[v];
            return (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeView === v
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{labels[v]}</span>
              </button>
            );
          })}
        </div>

        {/* Özet sayılar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
          <div className="p-5 text-center">
            <div className="text-3xl font-black text-slate-800">{currentSummary.total}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Toplam Görev</div>
          </div>
          <div className="p-5 text-center">
            <div className="text-3xl font-black text-green-600">{currentSummary.done}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Tamamlandı</div>
          </div>
          <div className="p-5 text-center">
            <div className="text-3xl font-black text-amber-500">{currentSummary.pending}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Bekleyen</div>
          </div>
          <div className="p-5 text-center">
            <div className={`text-3xl font-black ${(currentSummary.overdue ?? 0) > 0 ? "text-red-600" : "text-slate-300"}`}>
              {currentSummary.overdue ?? (currentSummary.total > 0 ? Math.max(0, currentSummary.total - currentSummary.done - currentSummary.pending) : 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Gecikmiş</div>
          </div>
        </div>

        {/* İlerleme çubuğu */}
        {currentSummary.total > 0 && (
          <div className="px-5 pb-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Tamamlanma</span>
              <span>{Math.round((currentSummary.done / currentSummary.total) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.round((currentSummary.done / currentSummary.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ===== FİLTRELER ===== */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Durum */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
          {[["pending", "Bekleyen"], ["done", "Tamamlanan"], ["all", "Tümü"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${filterStatus === v ? "bg-[#1B2437] text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Kategori */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="max-w-xs text-sm"
        >
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <span className="text-xs text-slate-400 ml-auto">{filtered.length} görev</span>
      </div>

      {/* ===== GÖREV LİSTESİ (Gruplu) ===== */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([groupKey, groupTasks]) => {
          if (groupTasks.length === 0) return null;
          if (filterStatus === "pending" && groupKey === "done") return null;
          if (filterStatus === "done" && groupKey !== "done") return null;

          const grp = groupLabels[groupKey as keyof typeof groupLabels];

          return (
            <div key={groupKey}>
              <h3 className={`text-sm font-bold mb-3 ${grp.color}`}>
                {grp.label}
                <span className="ml-2 text-xs font-normal text-slate-400">({groupTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {groupTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    expanded={expandedId === task.id}
                    onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
                    onToggleDone={() => toggleDone(task)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                    vehicles={vehicles}
                    drivers={drivers}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
            <CheckCircle2 className="w-16 h-16 text-green-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-500 mb-2">Görev yok</h3>
            <button onClick={openAdd} className="inline-flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" />
              Görev Ekle
            </button>
          </div>
        )}
      </div>

      {/* ===== GÖREV EKLEME/DÜZENLEME MODALI ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editTask ? "Görevi Düzenle" : "Yeni Görev"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Başlık */}
              <div>
                <label>Görev Adı *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Örn: 45 J 9443 muayenesi yaptır"
                  required
                  autoFocus
                />
              </div>

              {/* Kategori + Öncelik */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Kategori</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Öncelik</label>
                  <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                    {Object.entries(PRIORITIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tarih + Saat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Son Tarih</label>
                  <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
                </div>
                <div>
                  <label>Saat (opsiyonel)</label>
                  <input type="time" value={form.dueTime} onChange={(e) => set("dueTime", e.target.value)} />
                </div>
              </div>

              {/* Tekrar */}
              <div>
                <label>Tekrar</label>
                <select value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)}>
                  {Object.entries(RECURRENCES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {form.recurrence !== "none" && (
                  <p className="text-xs text-amber-600 mt-1">
                    ℹ️ Tekrarlı görevler tamamlanınca otomatik bir sonraki oluşturulur
                  </p>
                )}
              </div>

              {/* İlişkilendirme */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Araç (opsiyonel)</label>
                  <select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
                    <option value="">Seçin...</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                  </select>
                </div>
                <div>
                  <label>Şöför (opsiyonel)</label>
                  <select value={form.driverId} onChange={(e) => set("driverId", e.target.value)}>
                    <option value="">Seçin...</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label>Açıklama / Not</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Detaylar, irtibat bilgisi, randevu saati..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : editTask ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ GÖREV KARTI ============
function TaskCard({
  task,
  expanded,
  onToggleExpand,
  onToggleDone,
  onEdit,
  onDelete,
  vehicles,
  drivers,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  vehicles: { id: string; plate: string }[];
  drivers: { id: string; name: string }[];
}) {
  const cat = CATEGORIES[task.category as keyof typeof CATEGORIES] ?? CATEGORIES.diger;
  const pri = PRIORITIES[task.priority as keyof typeof PRIORITIES] ?? PRIORITIES.normal;
  const dueDateInfo = getDueDateLabel(task.dueDate);
  const isDone = task.status === "done";
  const vehicle = vehicles.find((v) => v.id === task.vehicleId);
  const driver = drivers.find((d) => d.id === task.driverId);

  return (
    <div className={`bg-white rounded-xl border transition-all ${isDone ? "border-slate-100 opacity-60" : "border-slate-100 hover:border-slate-200 hover:shadow-sm"}`}>
      <div className="flex items-center gap-3 p-4">
        {/* Tamamla butonu */}
        <button
          onClick={onToggleDone}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isDone ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-green-400"
          }`}
        >
          {isDone && <CheckCircle2 className="w-4 h-4" />}
        </button>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
              {task.title}
            </span>
            {task.priority === "urgent" && !isDone && (
              <span className="text-xs text-red-600 font-bold">🔴 ACİL</span>
            )}
            {task.priority === "high" && !isDone && (
              <span className="text-xs text-amber-600 font-bold">↑</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat.color}`}>
              {cat.icon} {cat.label}
            </span>
            {task.dueDate && (
              <span className={`text-xs flex items-center gap-1 ${dueDateInfo.color}`}>
                <Clock className="w-3 h-3" />
                {dueDateInfo.label}
                {task.dueTime && ` · ${task.dueTime}`}
              </span>
            )}
            {task.recurrence && task.recurrence !== "none" && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                {RECURRENCES[task.recurrence as keyof typeof RECURRENCES]}
              </span>
            )}
            {vehicle && (
              <span className="text-xs text-slate-400">{vehicle.plate}</span>
            )}
            {driver && (
              <span className="text-xs text-slate-400">{driver.name}</span>
            )}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.description && (
            <button onClick={onToggleExpand} className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Genişletilmiş açıklama */}
      {expanded && task.description && (
        <div className="px-4 pb-4 pt-0 ml-9">
          <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">{task.description}</p>
          {isDone && task.completedAt && (
            <p className="text-xs text-green-600 mt-2">
              ✅ Tamamlandı: {formatDateTime(task.completedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
