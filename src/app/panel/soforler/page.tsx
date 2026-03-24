import { prisma } from "@/lib/prisma";
import { getDocStatus, formatDate, getDocStatusColor } from "@/lib/utils";
import Link from "next/link";
import {
  Plus,
  Search,
  User,
  Phone,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import AddDriverModal from "./AddDriverModal";

async function getDrivers() {
  return prisma.driver.findMany({
    orderBy: { name: "asc" },
    include: { vehicle: true, _count: { select: { jobs: true } } },
  });
}

function DocBadge({
  label,
  expiry,
}: {
  label: string;
  expiry: Date | null | undefined;
}) {
  const status = getDocStatus(expiry);
  const colorClass = getDocStatusColor(status);
  const labels = {
    expired: "Geçersiz",
    critical: "Kritik",
    warning: "Yaklaşıyor",
    valid: "Geçerli",
    missing: "Yok",
  };
  return (
    <div
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}
    >
      {status === "valid" && <CheckCircle className="w-3 h-3" />}
      {(status === "expired" || status === "critical") && (
        <XCircle className="w-3 h-3" />
      )}
      {status === "warning" && <AlertTriangle className="w-3 h-3" />}
      <span>{label}: {labels[status]}</span>
    </div>
  );
}

export default async function DriversPage() {
  const drivers = await getDrivers();

  const activeCount = drivers.filter((d) => d.status === "active").length;
  const hasAlertCount = drivers.filter((d) => {
    const statuses = [
      getDocStatus(d.srcExpiry),
      getDocStatus(d.psychotechExpiry),
      getDocStatus(d.criminalRecordExpiry),
    ];
    return statuses.some((s) => s === "expired" || s === "critical" || s === "warning");
  }).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Şöförler</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeCount} aktif şöför
            {hasAlertCount > 0 && (
              <span className="text-amber-600 ml-2">· {hasAlertCount} belgede uyarı</span>
            )}
          </p>
        </div>
        <AddDriverModal />
      </div>

      {/* Şöför Kartları */}
      {drivers.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <User className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">Henüz şöför eklenmedi</h3>
          <p className="text-slate-400 text-sm mb-6">İlk şöförünüzü ekleyin</p>
          <AddDriverModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {drivers.map((driver) => {
            const overallStatus = [
              getDocStatus(driver.srcExpiry),
              getDocStatus(driver.psychotechExpiry),
              getDocStatus(driver.criminalRecordExpiry),
              getDocStatus(driver.healthReportExpiry),
            ];
            const hasExpired = overallStatus.some((s) => s === "expired");
            const hasCritical = overallStatus.some((s) => s === "critical");
            const hasWarning = overallStatus.some((s) => s === "warning");

            return (
              <Link
                key={driver.id}
                href={`/panel/soforler/${driver.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                        hasExpired || hasCritical
                          ? "bg-red-500"
                          : hasWarning
                          ? "bg-amber-500"
                          : "bg-[#1B2437]"
                      }`}
                    >
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{driver.name}</div>
                      {driver.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          {driver.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        driver.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {driver.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                    {driver.vehicle && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {driver.vehicle.plate}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </div>

                {/* Belge durumları */}
                <div className="flex flex-wrap gap-1.5">
                  <DocBadge label="SRC" expiry={driver.srcExpiry} />
                  <DocBadge label="Psiko" expiry={driver.psychotechExpiry} />
                  <DocBadge label="Adli Sicil" expiry={driver.criminalRecordExpiry} />
                  <DocBadge label="Sağlık" expiry={driver.healthReportExpiry} />
                </div>

                {/* Alt bilgi */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400">
                  <span className="font-medium">
                    Ehliyet: {driver.licenseClass ?? "-"}
                  </span>
                  <span>{driver._count.jobs} sefer</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
