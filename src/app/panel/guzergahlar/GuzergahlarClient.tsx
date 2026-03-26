"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Trash2, Edit2, CheckCircle, Clock, ChevronDown, ChevronUp, Search, X, GripVertical, Link2 } from "lucide-react";
import dynamic from "next/dynamic";
import { computeLiveStatus, type RouteStop } from "@/lib/routeStatus";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

interface Driver { id: string; name: string }
interface Vehicle { id: string; plate: string; brand?: string | null; model?: string | null }
interface Stop { id?: string; order: number; name: string; lat: number | null; lng: number | null; estimatedTime: string; notes?: string | null }
interface Route {
  id: string; name: string; type: string;
  driverId: string | null; vehicleId: string | null;
  weekdaysOnly: boolean; active: boolean; notes: string | null;
  driver: Driver | null; vehicle: Vehicle | null;
  stops: Stop[];
}

const emptyStop = (): Stop => ({ order: 0, name: "", lat: null, lng: null, estimatedTime: "" });

const typeLabels: Record<string, string> = {
  okul: "Okul Servisi",
  personel: "Personel",
  ozel: "Özel",
  transfer: "Transfer",
};

export default function GuzergahlarClient({
  initialRoutes, drivers, vehicles,
}: {
  initialRoutes: Route[];
  drivers: Driver[];
  vehicles: Vehicle[];
}) {
  const router = useRouter();
  const [routes, setRoutes] = useState(initialRoutes);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("okul");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [saving, setSaving] = useState(false);

  // Google Maps import
  const [gmapsUrl, setGmapsUrl] = useState("");
  const [gmapsLoading, setGmapsLoading] = useState(false);

  // Harita stop ekleme
  const [pendingStopIdx, setPendingStopIdx] = useState<number | null>(null);
  const [geoSearch, setGeoSearch] = useState<Record<number, string>>({});
  const [geoLoading, setGeoLoading] = useState<Record<number, boolean>>({});

  // Canlı zaman güncelleme
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  function openNew() {
    setEditingRoute(null);
    setName(""); setType("okul"); setDriverId(""); setVehicleId("");
    setWeekdaysOnly(true); setActive(true); setNotes("");
    setStops([{ ...emptyStop(), order: 0, estimatedTime: "07:30" }]);
    setShowForm(true);
  }

  function openEdit(r: Route) {
    setEditingRoute(r);
    setName(r.name); setType(r.type);
    setDriverId(r.driverId ?? ""); setVehicleId(r.vehicleId ?? "");
    setWeekdaysOnly(r.weekdaysOnly); setActive(r.active);
    setNotes(r.notes ?? "");
    setStops(r.stops.map((s) => ({ ...s })));
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditingRoute(null); }

  function addStop() {
    const last = stops[stops.length - 1];
    setStops([...stops, { ...emptyStop(), order: stops.length, estimatedTime: last?.estimatedTime ?? "" }]);
  }

  function removeStop(i: number) {
    setStops(stops.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx })));
  }

  function updateStop(i: number, field: keyof Stop, value: string | number | null) {
    setStops(stops.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function moveStop(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= stops.length) return;
    const next = [...stops];
    [next[i], next[j]] = [next[j], next[i]];
    setStops(next.map((s, idx) => ({ ...s, order: idx })));
  }

  async function importFromGmaps() {
    if (!gmapsUrl.trim()) return;
    setGmapsLoading(true);
    try {
      const res = await fetch("/api/parse-gmaps-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: gmapsUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Hata"); return; }
      const imported = (data.stops as { name: string; lat: number | null; lng: number | null }[]).map((s, i) => ({
        order: i,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        estimatedTime: "",
      }));
      setStops(imported);
      setGmapsUrl("");
      alert(`${imported.length} durak aktarıldı! Şimdi saatleri gir.`);
    } catch {
      alert("Bağlantı hatası");
    } finally {
      setGmapsLoading(false);
    }
  }

  async function geocode(i: number) {
    const q = geoSearch[i];
    if (!q) return;
    setGeoLoading({ ...geoLoading, [i]: true });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + " Türkiye")}&format=json&limit=1`,
        { headers: { "Accept-Language": "tr" } }
      );
      const data = await res.json();
      if (data[0]) {
        updateStop(i, "lat", parseFloat(data[0].lat));
        updateStop(i, "lng", parseFloat(data[0].lon));
      } else {
        alert("Adres bulunamadı");
      }
    } finally {
      setGeoLoading({ ...geoLoading, [i]: false });
    }
  }

  async function handleSave() {
    if (!name.trim() || stops.length === 0) {
      alert("Güzergah adı ve en az 1 durak gerekli");
      return;
    }
    setSaving(true);
    try {
      const body = { name, type, driverId: driverId || null, vehicleId: vehicleId || null, weekdaysOnly, active, notes: notes || null, stops };
      const url = editingRoute ? `/api/routes/${editingRoute.id}` : "/api/routes";
      const method = editingRoute ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      closeForm();
      router.refresh();
      const updated = await fetch("/api/routes").then((r) => r.json());
      setRoutes(updated);
    } catch (e) {
      alert("Kayıt hatası: " + e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu güzergahı sil?")) return;
    await fetch(`/api/routes/${id}`, { method: "DELETE" });
    setRoutes(routes.filter((r) => r.id !== id));
  }

  async function toggleActive(r: Route) {
    const res = await fetch(`/api/routes/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, stops: r.stops, active: !r.active }),
    });
    if (res.ok) setRoutes(routes.map((x) => x.id === r.id ? { ...x, active: !x.active } : x));
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Güzergahlar</h1>
          <p className="text-slate-500 text-sm mt-1">Sabit güzergahları bir kez tanımla, canlı olarak takip et</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Güzergah
        </button>
      </div>

      {routes.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Henüz güzergah tanımlanmadı</p>
          <p className="text-slate-400 text-sm mt-1">Okul servisi, personel güzergahı gibi sabit hatları buradan ekle</p>
          <button onClick={openNew} className="mt-4 px-4 py-2 bg-[#DC2626] text-white rounded-xl text-sm font-semibold">
            İlk Güzergahı Ekle
          </button>
        </div>
      )}

      {/* Güzergah listesi */}
      <div className="space-y-4">
        {routes.map((r) => {
          const status = computeLiveStatus(r.stops as RouteStop[], r.weekdaysOnly);
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${r.active ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
              <div className="p-5 flex items-center gap-4">
                {/* Durum göstergesi */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  !r.active ? "bg-slate-300" :
                  status.phase === "active" ? "bg-green-500 animate-pulse" :
                  status.phase === "completed" ? "bg-slate-400" :
                  status.phase === "weekend" ? "bg-blue-300" :
                  "bg-amber-400"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{r.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{typeLabels[r.type] ?? r.type}</span>
                    {r.weekdaysOnly && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Pzt–Cum</span>}
                    {!r.active && <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Pasif</span>}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    {r.driver && <span>👤 {r.driver.name}</span>}
                    {r.vehicle && <span>🚌 {r.vehicle.plate}</span>}
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.stops.length} durak</span>
                    {r.stops.length > 0 && (
                      <span><Clock className="w-3 h-3 inline" /> {r.stops[0].estimatedTime} – {r.stops[r.stops.length - 1].estimatedTime}</span>
                    )}
                  </div>
                  {r.active && status.phase !== "weekend" && (
                    <div className={`text-xs mt-1 font-medium ${
                      status.phase === "active" ? "text-green-600" :
                      status.phase === "completed" ? "text-slate-400" :
                      "text-amber-600"
                    }`}>
                      {status.label}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="p-2 text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleActive(r)} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${r.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {r.active ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-2 text-slate-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Genişletilmiş: duraklar + harita */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Durak listesi */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Duraklar</h3>
                    <div className="space-y-2">
                      {r.stops.map((s, i) => {
                        const isCur = r.active && status.phase === "active" && status.currentStopIndex === i;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm ${isCur ? "bg-green-50 border border-green-200" : "bg-slate-50"}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              i === 0 ? "bg-blue-500 text-white" : i === r.stops.length - 1 ? "bg-red-500 text-white" : isCur ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600"
                            }`}>{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 truncate">{s.name}</div>
                              {s.lat && <div className="text-xs text-slate-400">{s.lat.toFixed(4)}, {s.lng?.toFixed(4)}</div>}
                            </div>
                            <div className="font-mono text-sm font-bold text-slate-600 flex-shrink-0">{s.estimatedTime}</div>
                            {isCur && <span className="text-xs text-green-600 font-bold flex-shrink-0">◉ Şu an</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mini harita */}
                  <div className="rounded-xl overflow-hidden">
                    {r.stops.some((s) => s.lat) ? (
                      <RouteMap
                        stops={r.stops}
                        currentStopIndex={status.phase === "active" ? status.currentStopIndex : undefined}
                        height={280}
                      />
                    ) : (
                      <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                        <MapPin className="w-6 h-6 mr-2" />
                        Koordinat girilmemiş
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">{editingRoute ? "Güzergahı Düzenle" : "Yeni Güzergah"}</h2>
              <button onClick={closeForm} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Temel bilgiler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Güzergah Adı *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Sabah Okul Servisi" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]">
                    <option value="okul">Okul Servisi</option>
                    <option value="personel">Personel</option>
                    <option value="ozel">Özel</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şöför</label>
                  <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]">
                    <option value="">-- Seç --</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Araç</label>
                  <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]">
                    <option value="">-- Seç --</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} {v.brand} {v.model}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={weekdaysOnly} onChange={(e) => setWeekdaysOnly(e.target.checked)} className="w-4 h-4 accent-[#DC2626]" />
                    <span className="text-sm text-slate-700">Sadece Pzt–Cum</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-[#DC2626]" />
                    <span className="text-sm text-slate-700">Aktif</span>
                  </label>
                </div>
              </div>

              {/* Google Maps'ten yükle */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Google Maps&apos;ten Güzergah Yükle</span>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  Google Maps&apos;te yol tarifi oluştur → Paylaş → linki buraya yapıştır. Duraklar otomatik gelir, sadece saatleri girersin.
                </p>
                <div className="flex gap-2">
                  <input
                    value={gmapsUrl}
                    onChange={(e) => setGmapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... veya https://www.google.com/maps/dir/..."
                    className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    onKeyDown={(e) => e.key === "Enter" && importFromGmaps()}
                  />
                  <button
                    onClick={importFromGmaps}
                    disabled={gmapsLoading || !gmapsUrl.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {gmapsLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {gmapsLoading ? "Yükleniyor..." : "Yükle"}
                  </button>
                </div>
              </div>

              {/* Duraklar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-700">Duraklar</h3>
                  <button onClick={addStop} className="flex items-center gap-1 text-sm text-[#DC2626] hover:underline font-medium">
                    <Plus className="w-4 h-4" />Durak Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {stops.map((s, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveStop(i, -1)} disabled={i === 0} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                          <GripVertical className="w-4 h-4 text-slate-300" />
                          <button onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? "bg-blue-500" : i === stops.length - 1 ? "bg-red-500" : "bg-slate-400"}`}>{i + 1}</div>
                        <input
                          value={s.name}
                          onChange={(e) => updateStop(i, "name", e.target.value)}
                          placeholder="Durak adı (Örn: Okul Girişi)"
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                        />
                        <input
                          type="time"
                          value={s.estimatedTime}
                          onChange={(e) => updateStop(i, "estimatedTime", e.target.value)}
                          className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                        />
                        <button onClick={() => removeStop(i)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      {/* Konum */}
                      <div className="flex items-center gap-2 pl-10">
                        <div className="flex-1 flex gap-2 items-center">
                          <input
                            placeholder="Adres ara..."
                            value={geoSearch[i] ?? ""}
                            onChange={(e) => setGeoSearch({ ...geoSearch, [i]: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && geocode(i)}
                            className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                          />
                          <button
                            onClick={() => geocode(i)}
                            disabled={geoLoading[i]}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 disabled:opacity-50"
                          >
                            {geoLoading[i] ? <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
                          </button>
                        </div>
                        {s.lat && (
                          <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                            ✓ {s.lat.toFixed(4)}, {s.lng?.toFixed(4)}
                          </span>
                        )}
                        {!s.lat && (
                          <span className="text-xs text-slate-400 whitespace-nowrap">Koordinat yok</span>
                        )}
                      </div>

                      {/* Haritadan seç butonu */}
                      <div className="pl-10">
                        <button
                          onClick={() => setPendingStopIdx(pendingStopIdx === i ? null : i)}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${pendingStopIdx === i ? "bg-[#DC2626] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {pendingStopIdx === i ? "Haritaya tıkla → konum seç" : "Haritadan seç"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form haritası */}
              {stops.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    {pendingStopIdx !== null
                      ? `📍 Haritaya tıklayarak "${stops[pendingStopIdx]?.name || `Durak ${pendingStopIdx + 1}`}" konumunu belirle`
                      : "Güzergah önizlemesi"}
                  </p>
                  <RouteMap
                    stops={stops}
                    interactive={pendingStopIdx !== null}
                    height={300}
                    onMapClick={(lat, lng) => {
                      if (pendingStopIdx !== null) {
                        const updated = stops.map((s, idx) => idx === pendingStopIdx ? { ...s, lat, lng } : s);
                        setStops(updated);
                        setPendingStopIdx(null);
                      }
                    }}
                  />
                </div>
              )}

              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] resize-none" />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">İptal</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? "Kaydediliyor..." : editingRoute ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
