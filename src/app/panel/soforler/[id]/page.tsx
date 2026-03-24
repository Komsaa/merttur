import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  getDocStatus,
  getDocStatusColor,
  getDocStatusLabel,
  formatDate,
  getDaysLeft,
} from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  FileText,
  Car,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Edit,
} from "lucide-react";
import EditDriverForm from "./EditDriverForm";

interface Props {
  params: { id: string };
}

async function getDriver(id: string) {
  return prisma.driver.findUnique({
    where: { id },
    include: {
      vehicle: true,
      jobs: {
        take: 10,
        orderBy: { date: "desc" },
        include: { vehicle: true },
      },
      fuelEntries: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { vehicle: true },
      },
    },
  });
}

function DocRow({
  label,
  expiry,
  file,
  notes,
}: {
  label: string;
  expiry: Date | null | undefined;
  file?: string | null;
  notes?: string;
}) {
  const status = getDocStatus(expiry);
  const colorClass = getDocStatusColor(status);
  const daysLeft = getDaysLeft(expiry);

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status === "valid"
              ? "bg-green-50"
              : status === "missing"
              ? "bg-gray-50"
              : "bg-red-50"
          }`}
        >
          {status === "valid" ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : status === "missing" ? (
            <FileText className="w-4 h-4 text-gray-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          {notes && <div className="text-xs text-slate-400">{notes}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {expiry ? (
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">{formatDate(expiry)}</div>
            {daysLeft !== null && (
              <div
                className={`text-xs ${
                  daysLeft < 0 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-slate-400"
                }`}
              >
                {daysLeft < 0 ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Tarih girilmedi</span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colorClass}`}>
          {getDocStatusLabel(status)}
        </span>
      </div>
    </div>
  );
}

export default async function DriverDetailPage({ params }: Props) {
  const driver = await getDriver(params.id);
  if (!driver) notFound();

  const statusLabels: Record<string, string> = {
    planned: "Planlandı",
    active: "Aktif",
    completed: "Tamamlandı",
    cancelled: "İptal",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Üst Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/panel/soforler"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800">{driver.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  driver.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {driver.status === "active" ? "Aktif" : "Pasif"}
              </span>
              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                >
                  <Phone className="w-3 h-3" />
                  {driver.phone}
                </a>
              )}
            </div>
          </div>
        </div>
        <EditDriverForm driver={driver} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sol: Belgeler */}
        <div className="xl:col-span-2 space-y-4">
          {/* Şöför Belgeleri */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#DC2626]" />
              Şöför Belgeleri
            </h2>
            <DocRow
              label="SRC-2 Mesleki Yeterlilik"
              expiry={driver.srcExpiry}
              notes="5 yılda bir yenilenir"
            />
            <DocRow
              label="Psikoteknik Belgesi"
              expiry={driver.psychotechExpiry}
              notes="5 yılda bir (bazı bölgelerde 2 yılda)"
            />
            <DocRow
              label="Adli Sicil Kaydı"
              expiry={driver.criminalRecordExpiry}
              notes={`Alınma: ${formatDate(driver.criminalRecordDate)} · 3 ayda bir yenilenir`}
            />
            <DocRow
              label="Sağlık Raporu"
              expiry={driver.healthReportExpiry}
              notes="Yıllık yenilenir"
            />
            <DocRow
              label="Ehliyet"
              expiry={driver.licenseExpiry}
              notes={`Sınıf: ${driver.licenseClass ?? "-"} · ${driver.licenseNumber ?? ""}`}
            />
            <DocRow
              label="İkametgah Belgesi"
              expiry={driver.residenceDocDate}
              notes={driver.address ?? ""}
            />
          </div>

          {/* Son Seferler */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              Son Seferler
            </h2>
            {driver.jobs.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Henüz sefer kaydı yok</p>
            ) : (
              <div className="space-y-2">
                {driver.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{job.title}</div>
                      <div className="text-xs text-slate-400">
                        {formatDate(job.date)} · {job.startTime}
                        {job.endTime && ` - ${job.endTime}`}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        job.status === "completed"
                          ? "bg-slate-100 text-slate-500"
                          : job.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {statusLabels[job.status] ?? job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Bilgi */}
        <div className="space-y-4">
          {/* Araç */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4">Atanan Araç</h2>
            {driver.vehicle ? (
              <Link
                href={`/panel/araclar/${driver.vehicle.id}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1B2437] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {driver.vehicle.plate.slice(-3)}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{driver.vehicle.plate}</div>
                  <div className="text-xs text-slate-500">
                    {driver.vehicle.brand} {driver.vehicle.model}
                  </div>
                </div>
              </Link>
            ) : (
              <p className="text-slate-400 text-sm">Araç atanmadı</p>
            )}
          </div>

          {/* İstatistik */}
          <div className="bg-[#1B2437] rounded-2xl p-6 text-white">
            <h2 className="font-bold mb-4">İstatistikler</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Toplam Sefer</span>
                <span className="font-bold">{driver.jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Yakıt Girişi</span>
                <span className="font-bold">{driver.fuelEntries.length}</span>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {driver.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h3 className="font-semibold text-amber-800 text-sm mb-2">Notlar</h3>
              <p className="text-amber-700 text-sm">{driver.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
