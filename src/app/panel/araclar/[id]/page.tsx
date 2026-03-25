import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getDocStatus, getDocStatusColor, getDocStatusLabel, formatDate, getDaysLeft, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Fuel, FileText, AlertTriangle, CheckCircle, User, Edit } from "lucide-react";
import EditVehicleForm from "./EditVehicleForm";
import DocUploadButton from "@/components/DocUploadButton";

interface Props { params: { id: string } }

async function getVehicle(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      drivers: true,
      jobs: { take: 10, orderBy: { date: "desc" }, include: { driver: true } },
      fuelEntries: { take: 10, orderBy: { date: "desc" }, include: { driver: true } },
    },
  });
}

function DocRow({ label, expiry, fileUrl, entityId, docType, note }: { label: string; expiry: Date | null | undefined; fileUrl?: string | null; entityId: string; docType: string; note?: string }) {
  const status = getDocStatus(expiry);
  const colorClass = getDocStatusColor(status);
  const daysLeft = getDaysLeft(expiry);
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === "valid" ? "bg-green-50" : status === "missing" ? "bg-gray-50" : "bg-red-50"}`}>
          {status === "valid" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          {note && <div className="text-xs text-slate-400">{note}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {expiry ? (
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">{formatDate(expiry)}</div>
            {daysLeft !== null && (
              <div className={`text-xs ${daysLeft < 0 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-slate-400"}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}
              </div>
            )}
          </div>
        ) : <span className="text-xs text-slate-400">Girilmedi</span>}
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colorClass}`}>{getDocStatusLabel(status)}</span>
        <DocUploadButton entityType="vehicle" entityId={entityId} docType={docType} fileUrl={fileUrl} />
      </div>
    </div>
  );
}

export default async function VehicleDetailPage({ params }: Props) {
  const vehicle = await getVehicle(params.id);
  if (!vehicle) notFound();

  const totalFuel = vehicle.fuelEntries.reduce((s, e) => s + e.totalAmount, 0);
  const totalLiters = vehicle.fuelEntries.reduce((s, e) => s + e.liters, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/panel/araclar" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-wider">{vehicle.plate}</h1>
            <p className="text-slate-500 text-sm">{vehicle.brand} {vehicle.model} {vehicle.year && `· ${vehicle.year}`} {vehicle.capacity && `· ${vehicle.capacity} kişi`}</p>
          </div>
        </div>
        <EditVehicleForm vehicle={vehicle} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {/* Belgeler */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#DC2626]" />
              Araç Belgeleri
            </h2>
            <DocRow label="Teknik Muayene (TÜVTÜRK)" expiry={vehicle.inspectionExpiry} entityId={vehicle.id} docType="inspection" fileUrl={vehicle.inspectionFile} note="Ticari araçlar 6 ayda bir — ÇOK ÖNEMLİ!" />
            <DocRow label="Zorunlu Trafik Sigortası" expiry={vehicle.insuranceExpiry} entityId={vehicle.id} docType="insurance" fileUrl={vehicle.insuranceFile} note={vehicle.insurancePolicyNo ? `Poliçe: ${vehicle.insurancePolicyNo}` : undefined} />
            <DocRow label="Güzergah İzin Belgesi" expiry={vehicle.routePermitExpiry} entityId={vehicle.id} docType="routePermit" fileUrl={vehicle.routePermitFile} />
            <DocRow label="Okul Servisi Uygunluk / J Plaka" expiry={vehicle.approvalExpiry} entityId={vehicle.id} docType="approval" fileUrl={vehicle.approvalFile} note="Her yıl Eylülde yenilenir" />
            <DocRow label="Kasko" expiry={vehicle.kaskoExpiry} entityId={vehicle.id} docType="kasko" fileUrl={vehicle.kaskoFile} />
          </div>

          {/* Yakıt Geçmişi */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-500" />
              Yakıt Geçmişi
            </h2>
            {vehicle.fuelEntries.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Yakıt kaydı yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <th className="px-3 py-2 text-left">Tarih</th>
                      <th className="px-3 py-2 text-right">Litre</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                      <th className="px-3 py-2 text-right">KM</th>
                      <th className="px-3 py-2 text-left">Şöför</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {vehicle.fuelEntries.map((e) => (
                      <tr key={e.id} className="table-row-hover">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{e.liters.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">{formatCurrency(e.totalAmount)}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{e.odometer ? `${e.odometer.toLocaleString("tr-TR")} km` : "-"}</td>
                        <td className="px-3 py-2 text-slate-500">{e.driver?.name ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sağ panel */}
        <div className="space-y-4">
          {/* Özet */}
          <div className="bg-[#1B2437] rounded-2xl p-6 text-white">
            <h2 className="font-bold mb-4">Özet</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Toplam Sefer</span><span className="font-bold">{vehicle.jobs.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Toplam Yakıt</span><span className="font-bold">{formatCurrency(totalFuel)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Toplam Litre</span><span className="font-bold">{totalLiters.toFixed(0)} lt</span></div>
            </div>
          </div>

          {/* Şöförler */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4">Atanan Şöförler</h2>
            {vehicle.drivers.length === 0 ? (
              <p className="text-slate-400 text-sm">Şöför atanmadı</p>
            ) : (
              <div className="space-y-2">
                {vehicle.drivers.map((d) => (
                  <Link key={d.id} href={`/panel/soforler/${d.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                    <div className="w-8 h-8 bg-[#1B2437] rounded-lg flex items-center justify-center text-white text-xs font-bold">{d.name.charAt(0)}</div>
                    <span className="text-sm font-medium text-slate-700">{d.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
