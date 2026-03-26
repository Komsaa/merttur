import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Fuel, FileText, User } from "lucide-react";
import EditVehicleForm from "./EditVehicleForm";
import DocRow from "@/components/DocRow";
import ExtraDocuments from "@/components/ExtraDocuments";
import VehiclePhoto from "./VehiclePhoto";

interface Props { params: { id: string } }

type VehicleWithRelations = NonNullable<Awaited<ReturnType<typeof prisma.vehicle.findUnique<{
  where: { id: string };
  include: {
    drivers: true;
    jobs: { take: 10; orderBy: { date: "desc" }; include: { driver: true } };
    fuelEntries: { take: 10; orderBy: { date: "desc" }; include: { driver: true } };
  };
}>>>;

async function getVehicle(id: string): Promise<VehicleWithRelations | null> {
  try {
    return await prisma.vehicle.findUnique({
      where: { id },
      include: {
        drivers: true,
        jobs: { take: 10, orderBy: { date: "desc" }, include: { driver: true } },
        fuelEntries: { take: 10, orderBy: { date: "desc" }, include: { driver: true } },
      },
    });
  } catch (e) {
    console.error("getVehicle full query failed, trying basic:", e);
    try {
      const v = await prisma.vehicle.findUnique({ where: { id } });
      if (!v) return null;
      return { ...v, drivers: [], jobs: [], fuelEntries: [] } as unknown as VehicleWithRelations;
    } catch {
      return null;
    }
  }
}

export default async function VehicleDetailPage({ params }: Props) {
  const vehicle = await getVehicle(params.id);
  if (!vehicle) notFound();

  let extraDocs: Awaited<ReturnType<typeof prisma.document.findMany>> = [];
  try {
    extraDocs = await prisma.document.findMany({
      where: { entityType: "vehicle", entityId: params.id },
      orderBy: { createdAt: "desc" },
    });
  } catch { /* Document tablosu henüz oluşmadıysa sessizce geç */ }

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
          {/* Fotoğraf + Ruhsat */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" />
              Araç Fotoğrafı ve Ruhsat
            </h2>
            <VehiclePhoto vehicleId={vehicle.id} photoUrl={vehicle.photo ?? null} />
            <div className="mt-4">
              <DocRow label="Araç Ruhsatı" expiry={null} entityType="vehicle" entityId={vehicle.id} docType="ruhsat" fileUrl={vehicle.ruhsatFile ?? null} />
            </div>
          </div>

          {/* Belgeler */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#DC2626]" />
              Araç Belgeleri
            </h2>
            <DocRow label="Teknik Muayene (TÜVTÜRK)" expiry={vehicle.inspectionExpiry} entityType="vehicle" entityId={vehicle.id} docType="inspection" fileUrl={vehicle.inspectionFile} notes="Yılda bir yenilenir" />
            <DocRow label="Zorunlu Trafik Sigortası" expiry={vehicle.insuranceExpiry} entityType="vehicle" entityId={vehicle.id} docType="insurance" fileUrl={vehicle.insuranceFile} notes={vehicle.insurancePolicyNo ? `Poliçe: ${vehicle.insurancePolicyNo}` : undefined} />
            <DocRow label="Güzergah İzin Belgesi" expiry={vehicle.routePermitExpiry} entityType="vehicle" entityId={vehicle.id} docType="routePermit" fileUrl={vehicle.routePermitFile} />
            <DocRow label="Okul Servisi Uygunluk / J Plaka" expiry={vehicle.approvalExpiry} entityType="vehicle" entityId={vehicle.id} docType="approval" fileUrl={vehicle.approvalFile} notes="Her yıl Eylülde yenilenir" />
            <DocRow label="Kasko" expiry={vehicle.kaskoExpiry} entityType="vehicle" entityId={vehicle.id} docType="kasko" fileUrl={vehicle.kaskoFile} />
          </div>

          <ExtraDocuments entityType="vehicle" entityId={vehicle.id} initialDocs={extraDocs} />

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
