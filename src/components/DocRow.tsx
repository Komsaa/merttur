"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, FileText, AlertTriangle, Upload, ExternalLink, Loader2, CalendarPlus, Check } from "lucide-react";
import {
  getDocStatus,
  getDocStatusColor,
  getDocStatusLabel,
  getDaysLeft,
  formatDate,
} from "@/lib/utils";

// docType → API field adı
const DRIVER_DATE_FIELDS: Record<string, string> = {
  src: "srcExpiry",
  psychotech: "psychotechExpiry",
  criminalRecord: "criminalRecordExpiry",
  healthReport: "healthReportExpiry",
  license: "licenseExpiry",
  residenceDoc: "residenceDocDate",
};
const VEHICLE_DATE_FIELDS: Record<string, string> = {
  inspection: "inspectionExpiry",
  insurance: "insuranceExpiry",
  routePermit: "routePermitExpiry",
  approval: "approvalExpiry",
  kasko: "kaskoExpiry",
};

interface Props {
  label: string;
  expiry: Date | null | undefined;
  fileUrl?: string | null;
  entityType: "driver" | "vehicle";
  entityId: string;
  docType: string;
  notes?: string;
}

export default function DocRow({ label, expiry, fileUrl, entityType, entityId, docType, notes }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [savingDate, setSavingDate] = useState(false);

  const status = getDocStatus(expiry);
  const colorClass = getDocStatusColor(status);
  const daysLeft = getDaysLeft(expiry);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      fd.append("docType", docType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        let errMsg = "Yükleme hatası";
        try { const e = await res.json(); errMsg = e.error ?? errMsg; } catch {}
        throw new Error(errMsg);
      }
      toast.success(`${label} yüklendi!`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function saveDate() {
    if (!dateValue) return;
    const fieldMap = entityType === "driver" ? DRIVER_DATE_FIELDS : VEHICLE_DATE_FIELDS;
    const field = fieldMap[docType];
    if (!field) return;
    const apiPath = entityType === "driver" ? `/api/drivers/${entityId}` : `/api/vehicles/${entityId}`;
    setSavingDate(true);
    try {
      const res = await fetch(apiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: dateValue }),
      });
      if (!res.ok) throw new Error();
      toast.success("Tarih kaydedildi!");
      setShowDateInput(false);
      router.refresh();
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSavingDate(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  // Dosya yüklü ama tarih yok → özel durum
  const fileUploadedNoDate = !!fileUrl && !expiry;

  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-slate-50 last:border-0 rounded-lg px-2 -mx-2 transition-colors ${
        dragging ? "bg-blue-50 border border-blue-200 border-dashed" : ""
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
      onDrop={handleDrop}
    >
      {/* Sol: ikon + isim */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          fileUploadedNoDate ? "bg-amber-50" :
          status === "valid" ? "bg-green-50" : status === "missing" ? "bg-gray-50" : "bg-red-50"
        }`}>
          {fileUploadedNoDate ? (
            <CalendarPlus className="w-4 h-4 text-amber-500" />
          ) : status === "valid" ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : status === "missing" ? (
            <FileText className="w-4 h-4 text-gray-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          {notes && <div className="text-xs text-slate-400 truncate">{notes}</div>}
        </div>
      </div>

      {/* Sağ: tarih + butonlar */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {dragging ? (
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Upload className="w-3 h-3" /> Bırak
          </span>
        ) : showDateInput ? (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <button
              onClick={saveDate}
              disabled={savingDate || !dateValue}
              className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              {savingDate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </button>
            <button onClick={() => setShowDateInput(false)} className="text-xs text-slate-400 hover:text-slate-600 px-1">✕</button>
          </div>
        ) : expiry ? (
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">{formatDate(expiry)}</div>
            {daysLeft !== null && (
              <div className={`text-xs ${daysLeft < 0 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-slate-400"}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}
              </div>
            )}
          </div>
        ) : fileUploadedNoDate ? (
          <button
            onClick={() => setShowDateInput(true)}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg"
          >
            <CalendarPlus className="w-3 h-3" />
            Tarih gir
          </button>
        ) : (
          <button
            onClick={() => setShowDateInput(true)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <CalendarPlus className="w-3 h-3" />
            Tarih gir
          </button>
        )}

        {!dragging && !showDateInput && (
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
            fileUploadedNoDate
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : colorClass
          }`}>
            {fileUploadedNoDate ? "Tarih Eksik" : getDocStatusLabel(status)}
          </span>
        )}

        {!dragging && !showDateInput && (
          <div className="flex items-center gap-1">
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                <ExternalLink className="w-3 h-3" />
                Görüntüle
              </a>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? "..." : fileUrl ? "Güncelle" : "Yükle"}
            </button>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
    </div>
  );
}
