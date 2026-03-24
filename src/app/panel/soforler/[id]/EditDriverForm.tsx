"use client";

import { useState } from "react";
import { Edit, X, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Driver, Vehicle } from "@prisma/client";

interface Props {
  driver: Driver & { vehicle: Vehicle | null };
}

export default function EditDriverForm({ driver }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: driver.name,
    phone: driver.phone ?? "",
    status: driver.status,
    licenseClass: driver.licenseClass ?? "D",
    licenseNumber: driver.licenseNumber ?? "",
    srcExpiry: driver.srcExpiry ? driver.srcExpiry.toISOString().split("T")[0] : "",
    psychotechExpiry: driver.psychotechExpiry
      ? driver.psychotechExpiry.toISOString().split("T")[0]
      : "",
    criminalRecordDate: driver.criminalRecordDate
      ? driver.criminalRecordDate.toISOString().split("T")[0]
      : "",
    criminalRecordExpiry: driver.criminalRecordExpiry
      ? driver.criminalRecordExpiry.toISOString().split("T")[0]
      : "",
    healthReportExpiry: driver.healthReportExpiry
      ? driver.healthReportExpiry.toISOString().split("T")[0]
      : "",
    licenseExpiry: driver.licenseExpiry
      ? driver.licenseExpiry.toISOString().split("T")[0]
      : "",
    address: driver.address ?? "",
    notes: driver.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers/${driver.id}`, {
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
    if (!confirm(`${driver.name} silinsin mi?`)) return;
    try {
      const res = await fetch(`/api/drivers/${driver.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Şöför silindi");
      router.push("/panel/soforler");
    } catch {
      toast.error("Silinemedi");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 hover:border-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
      >
        <Edit className="w-4 h-4" />
        Düzenle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Şöför Düzenle</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Ad Soyad *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Telefon</label>
                  <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div>
                  <label>Durum</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="izinli">İzinli</option>
                  </select>
                </div>
                <div>
                  <label>Ehliyet Sınıfı</label>
                  <select value={form.licenseClass} onChange={(e) => set("licenseClass", e.target.value)}>
                    <option value="B">B</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
                <div>
                  <label>Ehliyet No</label>
                  <input type="text" value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Belge Tarihleri</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>SRC Bitiş</label>
                    <input type="date" value={form.srcExpiry} onChange={(e) => set("srcExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Psikoteknik Bitiş</label>
                    <input type="date" value={form.psychotechExpiry} onChange={(e) => set("psychotechExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Adli Sicil Alınma</label>
                    <input
                      type="date"
                      value={form.criminalRecordDate}
                      onChange={(e) => {
                        set("criminalRecordDate", e.target.value);
                        if (e.target.value) {
                          const d = new Date(e.target.value);
                          d.setMonth(d.getMonth() + 3);
                          set("criminalRecordExpiry", d.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label>Adli Sicil Bitiş</label>
                    <input type="date" value={form.criminalRecordExpiry} onChange={(e) => set("criminalRecordExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Sağlık Raporu Bitiş</label>
                    <input type="date" value={form.healthReportExpiry} onChange={(e) => set("healthReportExpiry", e.target.value)} />
                  </div>
                  <div>
                    <label>Ehliyet Yenileme</label>
                    <input type="date" value={form.licenseExpiry} onChange={(e) => set("licenseExpiry", e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label>Adres / İkametgah</label>
                <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} className="resize-none" />
              </div>
              <div>
                <label>Notlar</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  <Save className="w-4 h-4" />
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
