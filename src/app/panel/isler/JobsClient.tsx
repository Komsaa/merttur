"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Calendar, Clock, ChevronLeft, ChevronRight, User, Truck, CheckCircle, XCircle, Edit2, Trash2 } from "lucide-react";
import { format, addDays, subDays, startOfDay, isToday } from "date-fns";
import { tr } from "date-fns/locale";

type Job = {
  id: string;
  title: string;
  type: string;
  clientName: string | null;
  date: Date;
  startTime: string;
  endTime: string | null;
  status: string;
  route: string | null;
  revenue: number | null;
  notes: string | null;
  driver: { id: string; name: string } | null;
  vehicle: { id: string; plate: string; brand: string | null; model: string | null } | null;
};

type Driver = { id: string; name: string };
type Vehicle = { id: string; plate: string; brand: string | null; model: string | null };

const JOB_TYPES = { okul: "Okul Servisi", personel: "Personel Servisi", ozel: "Özel Sefer", transfer: "Transfer", gezi: "Gezi / Tur" };
const STATUS_LABELS = { planned: "Planlandı", active: "Aktif", completed: "Tamamlandı", cancelled: "İptal" };
const STATUS_COLORS = {
  planned: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-500",
  cancelled: "bg-red-100 text-red-600",
};
const TYPE_COLORS = {
  okul: "border-l-blue-500",
  personel: "border-l-purple-500",
  ozel: "border-l-amber-500",
  transfer: "border-l-teal-500",
  gezi: "border-l-pink-500",
};

interface Props {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

const emptyForm = {
  title: "",
  type: "okul",
  clientName: "",
  date: format(new Date(), "yyyy-MM-dd"),
  startTime: "07:30",
  endTime: "",
  driverId: "",
  vehicleId: "",
  route: "",
  revenue: "",
  status: "planned",
  notes: "",
};

export default function JobsClient({ jobs: initialJobs, drivers, vehicles }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"timeline" | "list">("timeline");

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  const dayJobs = useMemo(() => {
    const ds = format(selectedDate, "yyyy-MM-dd");
    return jobs
      .filter((j) => format(new Date(j.date), "yyyy-MM-dd") === ds)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [jobs, selectedDate]);

  function openAdd() {
    setEditJob(null);
    setForm({ ...emptyForm, date: format(selectedDate, "yyyy-MM-dd") });
    setShowModal(true);
  }

  function openEdit(job: Job) {
    setEditJob(job);
    setForm({
      title: job.title,
      type: job.type,
      clientName: job.clientName ?? "",
      date: format(new Date(job.date), "yyyy-MM-dd"),
      startTime: job.startTime,
      endTime: job.endTime ?? "",
      driverId: job.driver?.id ?? "",
      vehicleId: job.vehicle?.id ?? "",
      route: job.route ?? "",
      revenue: job.revenue?.toString() ?? "",
      status: job.status,
      notes: job.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("İş adı zorunlu"); return; }
    setLoading(true);
    try {
      const url = editJob ? `/api/jobs/${editJob.id}` : "/api/jobs";
      const method = editJob ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editJob ? "Güncellendi!" : "İş eklendi!");
      setShowModal(false);
      router.refresh();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu iş silinsin mi?")) return;
    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch { toast.error("Güncelleme hatası"); }
  }

  // Timeline saatleri (05:00 - 23:00)
  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  function getTimePosition(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h - 5) * 60 + m) / (18 * 60) * 100;
  }

  function getJobHeight(start: string, end: string | null): number {
    if (!end) return 4;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max((diff / (18 * 60)) * 100, 4);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">İşler / Seferler</h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })}
            {isToday(selectedDate) && <span className="text-green-600 ml-2">· Bugün</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setView("timeline")} className={`px-3 py-2 text-sm font-medium transition-colors ${view === "timeline" ? "bg-[#1B2437] text-white" : "text-slate-600 hover:bg-slate-50"}`}>Zaman</button>
            <button onClick={() => setView("list")} className={`px-3 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-[#1B2437] text-white" : "text-slate-600 hover:bg-slate-50"}`}>Liste</button>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            İş Ekle
          </button>
        </div>
      </div>

      {/* Tarih Navigasyon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedDate((d) => subDays(d, 1))} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex-shrink-0">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
          const d = addDays(new Date(), offset);
          const ds = format(d, "yyyy-MM-dd");
          const sel = format(selectedDate, "yyyy-MM-dd");
          const jobCount = jobs.filter((j) => format(new Date(j.date), "yyyy-MM-dd") === ds).length;
          return (
            <button
              key={offset}
              onClick={() => setSelectedDate(d)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0 ${
                ds === sel
                  ? "bg-[#DC2626] text-white shadow-md"
                  : isToday(d)
                  ? "bg-blue-50 border-2 border-blue-200 text-blue-700"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-xs font-medium">{format(d, "EEE", { locale: tr })}</span>
              <span className="font-bold text-base">{format(d, "d")}</span>
              {jobCount > 0 && (
                <span className={`text-xs mt-0.5 ${ds === sel ? "text-red-200" : "text-slate-400"}`}>
                  {jobCount} iş
                </span>
              )}
            </button>
          );
        })}
        <button onClick={() => setSelectedDate((d) => addDays(d, 1))} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* İçerik */}
      {dayJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-500 mb-2">Bu gün için iş yok</h3>
          <button onClick={openAdd} className="inline-flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            İş Ekle
          </button>
        </div>
      ) : view === "list" ? (
        <div className="space-y-3">
          {dayJobs.map((job) => (
            <div key={job.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${TYPE_COLORS[job.type as keyof typeof TYPE_COLORS] ?? "border-l-slate-300"} border border-slate-100 p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-800">{job.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status as keyof typeof STATUS_COLORS] ?? "bg-slate-100"}`}>{STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] ?? job.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.startTime}{job.endTime && ` – ${job.endTime}`}</span>
                    {job.driver && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{job.driver.name}</span>}
                    {job.vehicle && <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />{job.vehicle.plate}</span>}
                    {job.clientName && <span className="text-slate-400">{job.clientName}</span>}
                  </div>
                  {job.route && <p className="text-xs text-slate-400 mt-2">{job.route}</p>}
                </div>
                <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                  {job.status === "planned" && (
                    <button onClick={() => updateStatus(job.id, "active")} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Aktif yap">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {job.status === "active" && (
                    <button onClick={() => updateStatus(job.id, "completed")} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Tamamlandı">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => openEdit(job)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(job.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(drivers.length * 160 + 80, 600)}px` }}>
              {/* Header: şöförler */}
              <div className="flex border-b border-slate-100 bg-slate-50">
                <div className="w-20 flex-shrink-0 p-3 text-xs font-semibold text-slate-400 uppercase">Saat</div>
                {dayJobs.map((j) => j.driver?.name).filter((v, i, a) => v && a.indexOf(v) === i).map((name) => (
                  <div key={name} className="flex-1 min-w-[160px] p-3 text-sm font-semibold text-slate-700 border-l border-slate-100">{name}</div>
                ))}
                {dayJobs.filter((j) => !j.driver).length > 0 && (
                  <div className="flex-1 min-w-[160px] p-3 text-sm font-semibold text-slate-400 border-l border-slate-100">Atanmadı</div>
                )}
              </div>
              {/* Saat sütunları */}
              <div className="flex" style={{ height: "540px" }}>
                {/* Saat çizgileri */}
                <div className="w-20 flex-shrink-0 relative border-r border-slate-100">
                  {hours.map((h) => (
                    <div key={h} className="absolute w-full border-t border-slate-100 text-xs text-slate-300 pl-2 -mt-2" style={{ top: `${((h - 5) / 18) * 100}%` }}>
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {/* İşler */}
                {dayJobs.length > 0 && (() => {
                  const driverNames = Array.from(new Set(dayJobs.map((j) => j.driver?.name ?? "__none__")));
                  return driverNames.map((driverName) => {
                    const driverJobs = dayJobs.filter((j) => (j.driver?.name ?? "__none__") === driverName);
                    return (
                      <div key={driverName} className="flex-1 min-w-[160px] relative border-l border-slate-100">
                        {hours.map((h) => (
                          <div key={h} className="absolute w-full border-t border-slate-50" style={{ top: `${((h - 5) / 18) * 100}%`, height: `${(1 / 18) * 100}%` }} />
                        ))}
                        {driverJobs.map((job) => {
                          const top = getTimePosition(job.startTime);
                          const height = getJobHeight(job.startTime, job.endTime);
                          const typeColors: Record<string, string> = {
                            okul: "bg-blue-100 border-blue-300 text-blue-800",
                            personel: "bg-purple-100 border-purple-300 text-purple-800",
                            ozel: "bg-amber-100 border-amber-300 text-amber-800",
                            transfer: "bg-teal-100 border-teal-300 text-teal-800",
                            gezi: "bg-pink-100 border-pink-300 text-pink-800",
                          };
                          return (
                            <div
                              key={job.id}
                              onClick={() => openEdit(job)}
                              className={`absolute left-1 right-1 rounded-lg border p-1.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden ${typeColors[job.type] ?? "bg-slate-100 border-slate-300 text-slate-700"}`}
                              style={{ top: `${top}%`, height: `${Math.max(height, 6)}%` }}
                            >
                              <div className="text-xs font-semibold leading-tight truncate">{job.startTime} {job.title}</div>
                              {job.vehicle && <div className="text-xs opacity-70 truncate">{job.vehicle.plate}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editJob ? "İş Düzenle" : "Yeni İş"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label>İş / Sefer Adı *</label>
                <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Sabah okul servisi" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Tip</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                    {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label>Durum</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label>Müşteri / Sözleşme</label>
                <input type="text" value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Okul adı, firma adı..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label>Tarih</label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div>
                  <label>Başlangıç</label>
                  <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
                </div>
                <div>
                  <label>Bitiş</label>
                  <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Şöför</label>
                  <select value={form.driverId} onChange={(e) => set("driverId", e.target.value)}>
                    <option value="">Seçin...</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Araç</label>
                  <select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
                    <option value="">Seçin...</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label>Güzergah</label>
                <input type="text" value={form.route} onChange={(e) => set("route", e.target.value)} placeholder="Atatürk Mah. → Okul..." />
              </div>
              <div>
                <label>Gelir (₺)</label>
                <input type="number" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} placeholder="0" step="0.01" />
              </div>
              <div>
                <label>Notlar</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : editJob ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
