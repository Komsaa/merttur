"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Entry = {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: Date;
  description: string | null;
};

type FuelEntry = {
  id: string;
  date: Date;
  totalAmount: number;
  vehicle: { plate: string };
};

type MonthData = { month: string; income: number; expense: number; fuel: number };

const INCOME_CATS = { sozlesme: "Sözleşme Geliri", sefer: "Sefer Geliri", diger_gelir: "Diğer Gelir" };
const EXPENSE_CATS = { bakim: "Bakım / Tamir", sigorta: "Sigorta", harc: "Harç / Belge", vergi: "Vergi", maas: "Maaş", diger_gider: "Diğer Gider" };

interface Props {
  entries: Entry[];
  fuelEntries: FuelEntry[];
  drivers: { id: string; name: string }[];
  monthlyData: MonthData[];
}

export default function FinanceClient({ entries, fuelEntries, monthlyData }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    type: "income",
    category: "sozlesme",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    invoiceNo: "",
  });

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  const thisMonth = new Date();
  const mStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const mEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalFuel = fuelEntries.reduce((s, e) => s + e.totalAmount, 0);
  const monthIncome = entries.filter((e) => e.type === "income" && new Date(e.date) >= mStart && new Date(e.date) <= mEnd).reduce((s, e) => s + e.amount, 0);
  const monthFuel = fuelEntries.filter((e) => new Date(e.date) >= mStart && new Date(e.date) <= mEnd).reduce((s, e) => s + e.totalAmount, 0);
  const monthExpense = entries.filter((e) => e.type === "expense" && new Date(e.date) >= mStart && new Date(e.date) <= mEnd).reduce((s, e) => s + e.amount, 0) + monthFuel;

  const filtered = filterType === "all" ? entries : entries.filter((e) => e.type === filterType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) { toast.error("Tutar zorunlu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Kaydedildi!");
      setShowModal(false);
      router.refresh();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  // Kategori renkleri
  const catColors: Record<string, string> = {
    sozlesme: "bg-green-100 text-green-700", sefer: "bg-teal-100 text-teal-700", diger_gelir: "bg-emerald-100 text-emerald-700",
    yakıt: "bg-amber-100 text-amber-700", bakim: "bg-orange-100 text-orange-700", sigorta: "bg-blue-100 text-blue-700",
    harc: "bg-purple-100 text-purple-700", vergi: "bg-red-100 text-red-700", maas: "bg-pink-100 text-pink-700", diger_gider: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Finans</h1>
          <p className="text-slate-500 text-sm mt-1">Gelir ve gider takibi</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" />
          Kayıt Ekle
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
          <div className="text-xs text-slate-400 font-medium">Bu Ay Gelir</div>
          <div className="text-xl font-black text-slate-800">{formatCurrency(monthIncome)}</div>
          <div className="text-xs text-slate-400 mt-1">Toplam: {formatCurrency(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <TrendingDown className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-xs text-slate-400 font-medium">Bu Ay Gider</div>
          <div className="text-xl font-black text-slate-800">{formatCurrency(monthExpense)}</div>
          <div className="text-xs text-slate-400 mt-1">Yakıt dahil</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <Wallet className="w-8 h-8 text-amber-500 mb-3" />
          <div className="text-xs text-slate-400 font-medium">Bu Ay Yakıt</div>
          <div className="text-xl font-black text-slate-800">{formatCurrency(monthFuel)}</div>
          <div className="text-xs text-slate-400 mt-1">Veresiye dahil</div>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm border ${monthIncome - monthExpense >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <BarChart3 className={`w-8 h-8 mb-3 ${monthIncome - monthExpense >= 0 ? "text-green-600" : "text-red-500"}`} />
          <div className="text-xs text-slate-400 font-medium">Bu Ay Net</div>
          <div className={`text-xl font-black ${monthIncome - monthExpense >= 0 ? "text-green-700" : "text-red-600"}`}>
            {formatCurrency(monthIncome - monthExpense)}
          </div>
        </div>
      </div>

      {/* Grafik */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4">Son 6 Ay</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ color: "#1e293b", fontWeight: "bold" }} />
            <Legend />
            <Bar dataKey="income" name="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Gider (yakıt dahil)" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtre + Liste */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="font-bold text-slate-800 flex-1">Kayıtlar</h2>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            {[["all", "Tümü"], ["income", "Gelir"], ["expense", "Gider"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilterType(v)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterType === v ? "bg-[#1B2437] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {/* Yakıt giderlerini de göster */}
          {filterType !== "income" && fuelEntries.slice(0, 10).map((fe) => (
            <div key={`fuel-${fe.id}`} className="flex items-center gap-4 px-6 py-3.5">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700">Yakıt - {fe.vehicle.plate}</div>
                <div className="text-xs text-slate-400">{formatDate(fe.date)}</div>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">yakıt</span>
              <span className="font-bold text-red-600 text-sm">-{formatCurrency(fe.totalAmount)}</span>
            </div>
          ))}
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 px-6 py-3.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === "income" ? "bg-green-50" : "bg-red-50"}`}>
                {entry.type === "income" ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700">{entry.description ?? entry.category}</div>
                <div className="text-xs text-slate-400">{formatDate(entry.date)}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${catColors[entry.category] ?? "bg-slate-100 text-slate-500"}`}>{entry.category}</span>
              <span className={`font-bold text-sm ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
                {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
          {filtered.length === 0 && fuelEntries.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400">Kayıt yok</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Finans Kaydı Ekle</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tip seçici */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setEntryType("income"); set("type", "income"); set("category", "sozlesme"); }} className={`py-3 rounded-xl text-sm font-semibold transition-all ${form.type === "income" ? "bg-green-500 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}>
                  + Gelir
                </button>
                <button type="button" onClick={() => { setEntryType("expense"); set("type", "expense"); set("category", "bakim"); }} className={`py-3 rounded-xl text-sm font-semibold transition-all ${form.type === "expense" ? "bg-red-500 text-white" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  - Gider
                </button>
              </div>

              <div>
                <label>Kategori</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {Object.entries(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Tutar (₺) *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <label>Tarih</label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
              </div>
              <div>
                <label>Açıklama</label>
                <input type="text" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detay..." />
              </div>
              <div>
                <label>Fatura / Belge No</label>
                <input type="text" value={form.invoiceNo} onChange={(e) => set("invoiceNo", e.target.value)} placeholder="FT-2026-001" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
