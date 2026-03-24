"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Fuel, Trash2, Camera, AlertCircle, TrendingDown } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

type FuelEntry = {
  id: string;
  date: Date;
  liters: number;
  pricePerLiter: number | null;
  totalAmount: number;
  odometer: number | null;
  station: string | null;
  paymentType: string;
  notes: string | null;
  parsedFrom: string | null;
  vehicle: { id: string; plate: string };
  driver: { id: string; name: string } | null;
};

type Vehicle = { id: string; plate: string; brand: string | null; model: string | null };
type Driver = { id: string; name: string };
type MonthStat = { vehicleId: string; _sum: { totalAmount: number | null; liters: number | null } };

interface Props {
  fuelEntries: FuelEntry[];
  vehicles: Vehicle[];
  drivers: Driver[];
  monthStats: MonthStat[];
}

export default function FuelClient({ fuelEntries, vehicles, drivers, monthStats }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState("");
  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    date: new Date().toISOString().split("T")[0],
    liters: "",
    pricePerLiter: "",
    totalAmount: "",
    odometer: "",
    station: "Erkan Pamuk Çırçır",
    paymentType: "veresiye",
    notes: "",
  });

  function set(f: string, v: string) {
    setForm((p) => {
      const next = { ...p, [f]: v };
      // Otomatik hesaplama
      if (f === "liters" || f === "pricePerLiter") {
        const l = parseFloat(f === "liters" ? v : p.liters);
        const pp = parseFloat(f === "pricePerLiter" ? v : p.pricePerLiter);
        if (!isNaN(l) && !isNaN(pp)) next.totalAmount = (l * pp).toFixed(2);
      }
      if (f === "totalAmount" && next.liters) {
        const l = parseFloat(next.liters);
        const t = parseFloat(v);
        if (!isNaN(l) && !isNaN(t) && l > 0) next.pricePerLiter = (t / l).toFixed(4);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId || !form.liters || !form.totalAmount) {
      toast.error("Araç, litre ve tutar zorunlu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parsedFrom: "manual" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Yakıt kaydedildi!");
      setShowModal(false);
      setForm({ vehicleId: "", driverId: "", date: new Date().toISOString().split("T")[0], liters: "", pricePerLiter: "", totalAmount: "", odometer: "", station: "Erkan Pamuk Çırçır", paymentType: "veresiye", notes: "" });
      router.refresh();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yakıt kaydı silinsin mi?")) return;
    try {
      await fetch(`/api/fuel/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  const filtered = filterVehicle ? fuelEntries.filter((e) => e.vehicle.id === filterVehicle) : fuelEntries;
  const totalMonth = fuelEntries.reduce((s, e) => s + e.totalAmount, 0);
  const totalLiters = fuelEntries.reduce((s, e) => s + e.liters, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Yakıt Takibi</h1>
          <p className="text-slate-500 text-sm mt-1">
            Toplam: {totalLiters.toFixed(0)} lt · {formatCurrency(totalMonth)}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" />
          Yakıt Ekle
        </button>
      </div>

      {/* WhatsApp Bilgi Kutusu */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-800 mb-1">WhatsApp Bot Entegrasyonu</h3>
            <p className="text-green-700 text-sm mb-3">
              Şöförleriniz WP grubuna fiş fotoğrafı + km bilgisi atınca bot otomatik olarak kaydedecek.
            </p>
            <div className="bg-white border border-green-200 rounded-xl p-3 font-mono text-xs text-slate-600">
              <div className="text-green-600 font-semibold mb-1">Şöförler şunu atsın:</div>
              <div>📸 Fiş fotoğrafı</div>
              <div>+ <span className="text-blue-600">45J9443 - 125400 km</span></div>
            </div>
            <p className="text-green-600 text-xs mt-2">
              Bot kurulumu için: <code className="bg-green-100 px-1 rounded">npm run bot</code> komutunu çalıştırın
            </p>
          </div>
        </div>
      </div>

      {/* Araç bazlı ay özeti */}
      {monthStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {monthStats.map((stat) => {
            const v = vehicles.find((v) => v.id === stat.vehicleId);
            if (!v) return null;
            return (
              <div key={stat.vehicleId} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="font-black text-slate-800 text-sm tracking-wider">{v.plate}</div>
                <div className="text-lg font-bold text-[#DC2626] mt-1">{formatCurrency(stat._sum.totalAmount ?? 0)}</div>
                <div className="text-xs text-slate-400">{(stat._sum.liters ?? 0).toFixed(0)} lt</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtre */}
      <div className="flex items-center gap-3">
        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="max-w-xs"
        >
          <option value="">Tüm Araçlar</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} kayıt</span>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Fuel className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">Yakıt kaydı yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <th className="px-5 py-3 text-left">Tarih</th>
                  <th className="px-5 py-3 text-left">Araç</th>
                  <th className="px-5 py-3 text-left">Şöför</th>
                  <th className="px-5 py-3 text-right">Litre</th>
                  <th className="px-5 py-3 text-right">₺/lt</th>
                  <th className="px-5 py-3 text-right">Tutar</th>
                  <th className="px-5 py-3 text-right">KM</th>
                  <th className="px-5 py-3 text-center">Ödeme</th>
                  <th className="px-5 py-3 text-left">İstasyon</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="table-row-hover">
                    <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="px-5 py-3"><span className="font-bold text-slate-800 text-sm">{entry.vehicle.plate}</span></td>
                    <td className="px-5 py-3 text-sm text-slate-600">{entry.driver?.name ?? "-"}</td>
                    <td className="px-5 py-3 text-sm text-right text-slate-700">{entry.liters.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm text-right text-slate-500">{entry.pricePerLiter ? entry.pricePerLiter.toFixed(2) : "-"}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-slate-800">{formatCurrency(entry.totalAmount)}</td>
                    <td className="px-5 py-3 text-sm text-right text-slate-500">{entry.odometer ? entry.odometer.toLocaleString("tr-TR") : "-"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${entry.paymentType === "veresiye" ? "bg-amber-100 text-amber-700" : entry.paymentType === "kart" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {entry.paymentType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">{entry.station ?? "-"}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                  <td className="px-5 py-3 text-sm" colSpan={3}>Toplam</td>
                  <td className="px-5 py-3 text-sm text-right">{filtered.reduce((s, e) => s + e.liters, 0).toFixed(2)}</td>
                  <td></td>
                  <td className="px-5 py-3 text-sm text-right text-[#DC2626]">{formatCurrency(filtered.reduce((s, e) => s + e.totalAmount, 0))}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Yakıt Girişi</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Araç *</label>
                  <select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} required>
                    <option value="">Seçin...</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                  </select>
                </div>
                <div>
                  <label>Şöför</label>
                  <select value={form.driverId} onChange={(e) => set("driverId", e.target.value)}>
                    <option value="">Seçin...</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Tarih</label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label>Litre *</label>
                  <input type="number" step="0.01" value={form.liters} onChange={(e) => set("liters", e.target.value)} placeholder="56.95" required />
                </div>
                <div>
                  <label>₺/Litre</label>
                  <input type="number" step="0.001" value={form.pricePerLiter} onChange={(e) => set("pricePerLiter", e.target.value)} placeholder="67.39" />
                </div>
                <div>
                  <label>Toplam ₺ *</label>
                  <input type="number" step="0.01" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} placeholder="3837.86" required className="font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>KM (gösterge)</label>
                  <input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)} placeholder="125400" />
                </div>
                <div>
                  <label>Ödeme Tipi</label>
                  <select value={form.paymentType} onChange={(e) => set("paymentType", e.target.value)}>
                    <option value="veresiye">Veresiye</option>
                    <option value="nakit">Nakit</option>
                    <option value="kart">Kart</option>
                  </select>
                </div>
              </div>

              <div>
                <label>İstasyon</label>
                <input type="text" value={form.station} onChange={(e) => set("station", e.target.value)} placeholder="Erkan Pamuk Çırçır" />
              </div>

              <div>
                <label>Notlar</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="resize-none" />
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
