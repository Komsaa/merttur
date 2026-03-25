"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  entityType: "driver" | "vehicle";
  entityId: string;
  docType: string;
  fileUrl?: string | null;
}

export default function DocUploadButton({ entityType, entityId, docType, fileUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      fd.append("docType", docType);

      const res = await fetch("/api/upload", { method: "POST", body: fd });

      let errMsg = "Yükleme hatası";
      if (!res.ok) {
        try {
          const err = await res.json();
          errMsg = err.error ?? errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      toast.success("Belge yüklendi!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="flex items-center gap-1.5">
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          title="Belgeyi görüntüle"
        >
          <ExternalLink className="w-3 h-3" />
          Görüntüle
        </a>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
          dragging
            ? "bg-blue-100 text-blue-700 border border-blue-300 border-dashed"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        }`}
        title={fileUrl ? "Yeni belge yükle veya sürükle bırak" : "Belge yükle veya sürükle bırak"}
      >
        {uploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        {uploading ? "Yükleniyor..." : fileUrl ? "Güncelle" : "Yükle"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
