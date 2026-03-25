"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Trash2, ExternalLink, Upload, Loader2, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate, getDocStatus, getDocStatusColor, getDocStatusLabel, getDaysLeft } from "@/lib/utils";

type Doc = {
  id: string;
  name: string;
  expiry: Date | null;
  fileUrl: string | null;
  notes: string | null;
};

interface Props {
  entityType: "driver" | "vehicle";
  entityId: string;
  initialDocs: Doc[];
}

export default function ExtraDocuments({ entityType, entityId, initialDocs }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", expiry: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, expiry: form.expiry || null, notes: form.notes || null, entityType, entityId }),
      });
      if (!res.ok) throw new Error();
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      setForm({ name: "", expiry: "", notes: "" });
      setShowForm(false);
      toast.success("Belge eklendi!");
    } catch { toast.error("Eklenemedi"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu belge silinsin mi?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Silindi");
    } catch { toast.error("Silinemedi"); }
  }

  async function handleUpload(docId: string, file: File) {
    setUploadingId(docId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "document");
      fd.append("entityId", docId);
      fd.append("docType", "file");

      // Direkt dosya yolu hesapla ve yükle
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const formData2 = new FormData();
      formData2.append("file", file);
      formData2.append("entityType", entityType);
      formData2.append("entityId", entityId);
      formData2.append("docType", `extra_${docId}`);

      const res = await fetch("/api/upload", { method: "POST", body: formData2 });
      if (!res.ok) throw new Error();
      const { url } = await res.json();

      // Document kaydını güncelle
      await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url }),
      });

      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, fileUrl: url } : d));
      toast.success("Dosya yüklendi!");
    } catch { toast.error("Yükleme hatası"); }
    finally { setUploadingId(null); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          Ek Belgeler
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-[#DC2626] hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Belge Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Belge Adı *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sabıka kaydı, Taşıt kartı, Trafik cezası makbuzu..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Son Geçerlilik</label>
              <input
                type="date"
                value={form.expiry}
                onChange={(e) => set("expiry", e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Not</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Opsiyonel"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm">İptal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      )}

      {docs.length === 0 && !showForm ? (
        <p className="text-sm text-slate-400 text-center py-4">Henüz ek belge yok</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const status = getDocStatus(doc.expiry);
            const daysLeft = getDaysLeft(doc.expiry);
            const colorClass = getDocStatusColor(status);
            return (
              <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    status === "valid" ? "bg-green-50" : status === "missing" ? "bg-gray-50" : "bg-red-50"
                  }`}>
                    {status === "valid" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                     status === "missing" ? <FileText className="w-3.5 h-3.5 text-gray-400" /> :
                     <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{doc.name}</div>
                    {doc.expiry ? (
                      <div className="text-xs text-slate-400">
                        {formatDate(doc.expiry)}
                        {daysLeft !== null && (
                          <span className={`ml-1 ${daysLeft < 0 ? "text-red-500" : daysLeft <= 30 ? "text-amber-500" : ""}`}>
                            · {daysLeft < 0 ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}
                          </span>
                        )}
                      </div>
                    ) : doc.notes ? (
                      <div className="text-xs text-slate-400">{doc.notes}</div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {doc.expiry && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${colorClass}`}>
                      {getDocStatusLabel(status)}
                    </span>
                  )}
                  {doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      Görüntüle
                    </a>
                  ) : (
                    <label className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg cursor-pointer">
                      {uploadingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Yükle
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(doc.id, f); }} />
                    </label>
                  )}
                  <button onClick={() => handleDelete(doc.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
