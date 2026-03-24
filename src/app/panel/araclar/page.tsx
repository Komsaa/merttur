import { prisma } from "@/lib/prisma";
import { getDocStatus, formatDate, getDocStatusColor, getDaysLeft } from "@/lib/utils";
import Link from "next/link";
import { Plus, Truck, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import AddVehicleModal from "./AddVehicleModal";

async function getVehicles() {
  return prisma.vehicle.findMany({
    orderBy: { plate: "asc" },
    include: {
      drivers: { select: { id: true, name: true } },
      _count: { select: { jobs: true, fuelEntries: true } },
    },
  });
}

export default async function VehiclesPage() {
  const vehicles = await getVehicles();
  const activeCount = vehicles.filter((v) => v.status === "active").length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Araçlar</h1>
          <p className="text-slate-500 text-sm mt-1">{activeCount} aktif araç</p>
        </div>
        <AddVehicleModal />
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">Henüz araç eklenmedi</h3>
          <AddVehicleModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => {
            // Muayene 6 ayda bir - en kritik belge
            const inspectionStatus = getDocStatus(vehicle.inspectionExpiry);
            const insuranceStatus = getDocStatus(vehicle.insuranceExpiry);
            const routeStatus = getDocStatus(vehicle.routePermitExpiry);
            const approvalStatus = getDocStatus(vehicle.approvalExpiry);

            const statuses = [inspectionStatus, insuranceStatus, routeStatus, approvalStatus];
            const hasExpired = statuses.some((s) => s === "expired");
            const hasCritical = statuses.some((s) => s === "critical");
            const hasWarning = statuses.some((s) => s === "warning");

            const inspDaysLeft = getDaysLeft(vehicle.inspectionExpiry);

            return (
              <Link
                key={vehicle.id}
                href={`/panel/araclar/${vehicle.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all p-6 group"
              >
                {/* Üst: Plaka + durum */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${
                        hasExpired || hasCritical
                          ? "bg-red-500"
                          : hasWarning
                          ? "bg-amber-500"
                          : "bg-[#1B2437]"
                      }`}
                    >
                      {vehicle.plate.replace(/\s/g, "\n").split("\n").join("")
                        .slice(-4)}
                    </div>
                    <div>
                      <div className="font-black text-lg text-slate-800 tracking-wider">
                        {vehicle.plate}
                      </div>
                      <div className="text-xs text-slate-500">
                        {vehicle.brand} {vehicle.model}
                        {vehicle.year ? ` · ${vehicle.year}` : ""}
                        {vehicle.capacity ? ` · ${vehicle.capacity} kişi` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        vehicle.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {vehicle.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </div>

                {/* Belge durumları - grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <VehicleDocMini
                    label="Muayene"
                    expiry={vehicle.inspectionExpiry}
                    note="6 ayda bir"
                  />
                  <VehicleDocMini
                    label="Sigorta"
                    expiry={vehicle.insuranceExpiry}
                  />
                  <VehicleDocMini
                    label="Güzergah İzni"
                    expiry={vehicle.routePermitExpiry}
                  />
                  <VehicleDocMini
                    label="Uygunluk Belgesi"
                    expiry={vehicle.approvalExpiry}
                  />
                </div>

                {/* Alt: Şöför + sefer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs text-slate-400">
                  <span>
                    {vehicle.drivers.length > 0
                      ? `Şöför: ${vehicle.drivers.map((d) => d.name).join(", ")}`
                      : "Şöför atanmadı"}
                  </span>
                  <span>{vehicle._count.jobs} sefer · {vehicle._count.fuelEntries} yakıt</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VehicleDocMini({
  label,
  expiry,
  note,
}: {
  label: string;
  expiry: Date | null | undefined;
  note?: string;
}) {
  const status = getDocStatus(expiry);
  const daysLeft = getDaysLeft(expiry);
  const color = getDocStatusColor(status);

  return (
    <div className={`rounded-lg p-2.5 border ${color} text-xs`}>
      <div className="font-semibold">{label}</div>
      {note && <div className="opacity-60 text-xs">{note}</div>}
      {expiry ? (
        <div className="mt-1 font-medium">
          {daysLeft !== null && daysLeft < 0
            ? `${Math.abs(daysLeft)}g geçti`
            : daysLeft !== null
            ? `${daysLeft} gün`
            : formatDate(expiry)}
        </div>
      ) : (
        <div className="mt-1 opacity-50">Girilmedi</div>
      )}
    </div>
  );
}
