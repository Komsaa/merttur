"use client";

import { useState } from "react";
import { Plus, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddDriverModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    licenseClass: "D",
    srcExpiry: "",
    psychotechExpiry: "",
    criminalRecordDate: "",
    criminalRecordExpiry: "",
    healthReportExpiry: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Şöför adı zorunlu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Şöför eklendi!");
      setOpen(false);
      setForm({
        name: "",
        phone: "",
        licenseClass: "D",
        srcExpiry: "",
        psychotechExpiry: "",
        criminalRecordDate: "",
        criminalRecordExpiry: "",
        healthReportExpiry: "",
        notes: "",
      });
      router.refresh();
    } catch {
      toast.error("Hata oluştu");
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
        Şöför Ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DC2626]/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#DC2626]" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Yeni Şöför</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Ad Soyad *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    required
                  />
                </div>
                <div>
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <label>Ehliyet Sınıfı</label>
                  <select
                    value={form.licenseClass}
                    onChange={(e) => set("licenseClass", e.target.value)}
                  >
                    <option value="B">B</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="BD">B+D</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Belge Son Tarihleri
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>SRC Belgesi Bitiş</label>
                    <input
                      type="date"
                      value={form.srcExpiry}
                      onChange={(e) => set("srcExpiry", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Psikoteknik Bitiş</label>
                    <input
                      type="date"
                      value={form.psychotechExpiry}
                      onChange={(e) => set("psychotechExpiry", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Sağlık Raporu Bitiş</label>
                    <input
                      type="date"
                      value={form.healthReportExpiry}
                      onChange={(e) => set("healthReportExpiry", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Adli Sicil Alınma Tarihi</label>
                    <input
                      type="date"
                      value={form.criminalRecordDate}
                      onChange={(e) => {
                        set("criminalRecordDate", e.target.value);
                        // Otomatik 3 ay sonra bitiş hesapla
                        if (e.target.value) {
                          const d = new Date(e.target.value);
                          d.setMonth(d.getMonth() + 3);
                          set(
                            "criminalRecordExpiry",
                            d.toISOString().split("T")[0]
                          );
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label>Adli Sicil Bitiş (otomatik)</label>
                    <input
                      type="date"
                      value={form.criminalRecordExpiry}
                      onChange={(e) => set("criminalRecordExpiry", e.target.value)}
                      className="bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label>Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Ek bilgi..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  {loading ? "Kaydediliyor..." : "Şöför Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
