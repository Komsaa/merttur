"use client";

import { useState } from "react";
import { Plus, X, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddVehicleModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    capacity: "14",
    color: "Sarı",
    inspectionExpiry: "",
    insuranceExpiry: "",
    routePermitExpiry: "",
    approvalExpiry: "",
    kaskoExpiry: "",
    plateAuthExpiry: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.plate.trim()) { toast.error("Plaka zorunlu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sunucu hatası");
      }
      toast.success("Araç eklendi!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      >
        <Plus className="w-4 h-4" />
        Araç Ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DC2626]/10 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#DC2626]" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Yeni Araç</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Plaka * (örn: 45 J 9443)</label>
                  <input
                    type="text"
                    value={form.plate}
                    onChange={(e) => set("plate", e.target.value.toUpperCase())}
                    placeholder="45 J 9443"
                    required
                    className="uppercase"
                  />
                </div>
                <div>
                  <label>Marka</label>
                  <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Ford, Mercedes..." />
                </div>
                <div>
                  <label>Model</label>
                  <input type="text" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Transit, Sprinter..." />
                </div>
                <div>
                  <label>Yıl</label>
                  <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2020" min="2000" max="2030" />
                </div>
                <div>
                  <label>Kapasite (kişi)</label>
                  <input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} min="1" max="50" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Belge Son Tarihleri
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-amber-700 font-semibold">⚠️ Muayene Bitiş (yılda bir)</label>
                    <input type="date" value={form.inspectionExpiry} onChange={(e) => set("inspectionExpiry", e.target.value)} className="border-amber-200 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label>Trafik Sigortası Bitiş</label>
                    <input type="date" value={form.insuranceExpiry} onChange={(e) => set("insuranceExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Güzergah İzni Bitiş</label>
                    <input type="date" value={form.routePermitExpiry} onChange={(e) => set("routePermitExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Uygunluk Belgesi / J Plaka</label>
                    <input type="date" value={form.approvalExpiry} onChange={(e) => set("approvalExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Kasko Bitiş</label>
                    <input type="date" value={form.kaskoExpiry} onChange={(e) => set("kaskoExpiry", e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label>Notlar</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : "Araç Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
