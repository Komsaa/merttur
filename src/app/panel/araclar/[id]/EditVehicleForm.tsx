"use client";

import { useState } from "react";
import { Edit, X, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Vehicle } from "@prisma/client";

function d(date: Date | null | undefined) {
  return date ? new Date(date).toISOString().split("T")[0] : "";
}

export default function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plate: vehicle.plate,
    brand: vehicle.brand ?? "",
    model: vehicle.model ?? "",
    year: vehicle.year?.toString() ?? "",
    capacity: vehicle.capacity?.toString() ?? "",
    status: vehicle.status,
    insuranceCompany: vehicle.insuranceCompany ?? "",
    insurancePolicyNo: vehicle.insurancePolicyNo ?? "",
    routePermitNumber: vehicle.routePermitNumber ?? "",
    inspectionExpiry: d(vehicle.inspectionExpiry),
    insuranceExpiry: d(vehicle.insuranceExpiry),
    routePermitExpiry: d(vehicle.routePermitExpiry),
    approvalExpiry: d(vehicle.approvalExpiry),
    kaskoExpiry: d(vehicle.kaskoExpiry),
    plateAuthExpiry: d(vehicle.plateAuthExpiry),
    notes: vehicle.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Kaydedildi!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`${vehicle.plate} silinsin mi?`)) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Araç silindi");
      router.push("/panel/araclar");
    } catch { toast.error("Silinemedi"); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 hover:border-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-all">
        <Edit className="w-4 h-4" />
        Düzenle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Araç Düzenle — {vehicle.plate}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label>Plaka</label><input type="text" value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} className="uppercase" /></div>
                <div><label>Durum</label><select value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Aktif</option><option value="inactive">Pasif</option><option value="serviste">Serviste</option></select></div>
                <div><label>Marka</label><input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} /></div>
                <div><label>Model</label><input type="text" value={form.model} onChange={(e) => set("model", e.target.value)} /></div>
                <div><label>Yıl</label><input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} /></div>
                <div><label>Kapasite</label><input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Sigorta Bilgisi</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label>Sigorta Şirketi</label><input type="text" value={form.insuranceCompany} onChange={(e) => set("insuranceCompany", e.target.value)} /></div>
                  <div><label>Poliçe No</label><input type="text" value={form.insurancePolicyNo} onChange={(e) => set("insurancePolicyNo", e.target.value)} /></div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Belge Tarihleri</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-amber-700 font-semibold">⚠️ Muayene Bitiş</label><input type="date" value={form.inspectionExpiry} onChange={(e) => set("inspectionExpiry", e.target.value)} /></div>
                  <div><label>Sigorta Bitiş</label><input type="date" value={form.insuranceExpiry} onChange={(e) => set("insuranceExpiry", e.target.value)} /></div>
                  <div><label>Güzergah İzni Bitiş</label><input type="date" value={form.routePermitExpiry} onChange={(e) => set("routePermitExpiry", e.target.value)} /></div>
                  <div><label>Uygunluk / J Plaka Bitiş</label><input type="date" value={form.approvalExpiry} onChange={(e) => set("approvalExpiry", e.target.value)} /></div>
                  <div><label>Kasko Bitiş</label><input type="date" value={form.kaskoExpiry} onChange={(e) => set("kaskoExpiry", e.target.value)} /></div>
                </div>
              </div>

              <div><label>Notlar</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="resize-none" /></div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  <Save className="w-4 h-4" />{loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
