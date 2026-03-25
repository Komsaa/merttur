"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Save, Trash2, CheckCircle, Clock, ChevronLeft, ChevronRight, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Driver = { id: string; name: string; phone: string | null };
type Salary = {
  id: string;
  driverId: string;
  month: number;
  year: number;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  paid: boolean;
  paidAt: Date | null;
  notes: string | null;
  driver: { id: string; name: string };
};

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

interface Props {
  drivers: Driver[];
  salaries: Salary[];
}

export default function SalaryClient({ drivers, salaries: initialSalaries }: Props) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [salaries, setSalaries] = useState(initialSalaries);
  const [showModal, setShowModal] = useState(false);
  const [editSalary, setEditSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    driverId: "",
    baseAmount: "",
    bonusAmount: "0",
    notes: "",
  });

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  const monthSalaries = useMemo(
    () => salaries.filter((s) => s.month === month && s.year === year),
    [salaries, month, year]
  );

  // Ay'da maaşı olmayan şöförler
  const missingDrivers = useMemo(
    () => drivers.filter((d) => !monthSalaries.find((s) => s.driverId === d.id)),
    [drivers, monthSalaries]
  );

  const totalMonth = monthSalaries.reduce((s, x) => s + x.totalAmount, 0);
  const paidCount = monthSalaries.filter((s) => s.paid).length;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function openAdd(driverId?: string) {
    setEditSalary(null);
    setForm({ driverId: driverId ?? "", baseAmount: "", bonusAmount: "0", notes: "" });
    setShowModal(true);
  }

  function openEdit(s: Salary) {
    setEditSalary(s);
    setForm({
      driverId: s.driverId,
      baseAmount: s.baseAmount.toString(),
      bonusAmount: s.bonusAmount.toString(),
      notes: s.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.driverId) { toast.error("Şöför seçin"); return; }
    setLoading(true);
    try {
      if (editSalary) {
        const res = await fetch(`/api/salaries/${editSalary.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseAmount: form.baseAmount, bonusAmount: form.bonusAmount, notes: form.notes }),
        });
        if (!res.ok) throw new Error();
        toast.success("Güncellendi!");
      } else {
        const res = await fetch("/api/salaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, month, year }),
        });
        if (!res.ok) throw new Error();
        toast.success("Maaş eklendi!");
      }
      setShowModal(false);
      router.refresh();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  async function togglePaid(s: Salary) {
    try {
      const res = await fetch(`/api/salaries/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !s.paid }),
      });
      if (!res.ok) throw new Error();
      setSalaries((prev) => prev.map((x) => x.id === s.id ? { ...x, paid: !x.paid } : x));
      toast.success(s.paid ? "Ödenmedi olarak işaretlendi" : "Ödendi olarak işaretlendi!");
    } catch { toast.error("Güncellenemedi"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu maaş kaydı silinsin mi?")) return;
    try {
      await fetch(`/api/salaries/${id}`, { method: "DELETE" });
      setSalaries((prev) => prev.filter((s) => s.id !== id));
      toast.success("Silindi");
    } catch { toast.error("Silinemedi"); }
  }

  const total = parseFloat(form.baseAmount || "0") + parseFloat(form.bonusAmount || "0");

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Maaşlar</h1>
          <p className="text-slate-500 text-sm mt-1">Şöför maaş takibi ve ödemeleri</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Maaş Ekle
        </button>
      </div>

      {/* Ay seçici */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-lg font-bold text-slate-800">{MONTHS[month - 1]} {year}</span>
        </div>
        <button onClick={nextMonth} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="text-xs text-slate-500 mb-1">Bu Ay Toplam</div>
          <div className="text-xl font-black text-slate-800">{formatCurrency(totalMonth)}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="text-xs text-slate-500 mb-1">Ödenen</div>
          <div className="text-xl font-black text-green-600">
            {formatCurrency(monthSalaries.filter((s) => s.paid).reduce((t, s) => t + s.totalAmount, 0))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="text-xs text-slate-500 mb-1">Bekleyen</div>
          <div className="text-xl font-black text-amber-600">
            {formatCurrency(monthSalaries.filter((s) => !s.paid).reduce((t, s) => t + s.totalAmount, 0))}
          </div>
        </div>
      </div>

      {/* Maaş listesi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#DC2626]" />
            {MONTHS[month - 1]} {year} Maaşları
          </h2>
          <span className="text-xs text-slate-400">{paidCount}/{monthSalaries.length} ödendi</span>
        </div>

        {monthSalaries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Banknote className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium mb-1">Bu ay için maaş girişi yok</p>
            <p className="text-slate-400 text-sm mb-4">Tüm şöförleri hızlıca ekleyebilirsiniz</p>
            <button onClick={() => openAdd()} className="text-sm bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl font-semibold">
              Maaş Ekle
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {monthSalaries.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B2437] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {s.driver.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{s.driver.name}</div>
                    <div className="text-xs text-slate-400">
                      Sabit: {formatCurrency(s.baseAmount)}
                      {s.bonusAmount > 0 && ` + Prim: ${formatCurrency(s.bonusAmount)}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-slate-800 text-lg">{formatCurrency(s.totalAmount)}</div>
                    {s.notes && <div className="text-xs text-slate-400 max-w-32 truncate">{s.notes}</div>}
                  </div>

                  <button
                    onClick={() => togglePaid(s)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                      s.paid
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    {s.paid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {s.paid ? "Ödendi" : "Öde"}
                  </button>

                  <button onClick={() => openEdit(s)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eklenmemiş şöförler */}
      {missingDrivers.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-600 mb-3">Bu ay maaş girilmemiş şöförler:</p>
          <div className="flex flex-wrap gap-2">
            {missingDrivers.map((d) => (
              <button
                key={d.id}
                onClick={() => openAdd(d.id)}
                className="flex items-center gap-2 text-sm bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#DC2626]" />
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editSalary ? "Maaş Düzenle" : `Maaş Ekle — ${MONTHS[month - 1]} ${year}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editSalary && (
                <div>
                  <label>Şöför *</label>
                  <select value={form.driverId} onChange={(e) => set("driverId", e.target.value)} required>
                    <option value="">Seçin...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Sabit Maaş (₺) *</label>
                  <input
                    type="number"
                    value={form.baseAmount}
                    onChange={(e) => set("baseAmount", e.target.value)}
                    placeholder="15000"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label>Prim / Ek (₺)</label>
                  <input
                    type="number"
                    value={form.bonusAmount}
                    onChange={(e) => set("bonusAmount", e.target.value)}
                    placeholder="0"
                    step="0.01"
                  />
                </div>
              </div>
              {total > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <span className="text-sm text-slate-500">Toplam: </span>
                  <span className="text-lg font-black text-slate-800">{formatCurrency(total)}</span>
                </div>
              )}
              <div>
                <label>Not</label>
                <input type="text" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Yol parası dahil, vb." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : editSalary ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
